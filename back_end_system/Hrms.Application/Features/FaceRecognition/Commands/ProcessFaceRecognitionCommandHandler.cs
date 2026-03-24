using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;
using Hrms.Application.DTOs.FaceRecognition;
using Hrms.Application.Features.FaceRecognition.Commands;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.FaceRecognition.Commands
{
    /// <summary>
    /// Handler xử lý nhận diện khuôn mặt
    /// 1. Kiểm tra device có online không
    /// 2. Gửi ảnh đến Python AI Service để nhận diện
    /// 3. So sánh với database để tìm employee
    /// 4. Lưu device log
    /// 5. Trả về kết quả
    /// </summary>
    public class ProcessFaceRecognitionCommandHandler : IRequestHandler<ProcessFaceRecognitionCommand, FaceRecognitionResponseDto>
    {
        private readonly IIoTDeviceRepository _deviceRepository;
        private readonly IFaceTemplateRepository _faceTemplateRepository;
        private readonly IAttendanceDeviceLogRepository _deviceLogRepository;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<ProcessFaceRecognitionCommandHandler> _logger;

        public ProcessFaceRecognitionCommandHandler(
            IIoTDeviceRepository deviceRepository,
            IFaceTemplateRepository faceTemplateRepository,
            IAttendanceDeviceLogRepository deviceLogRepository,
            IHttpClientFactory httpClientFactory,
            ILogger<ProcessFaceRecognitionCommandHandler> logger)
        {
            _deviceRepository = deviceRepository;
            _faceTemplateRepository = faceTemplateRepository;
            _deviceLogRepository = deviceLogRepository;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<FaceRecognitionResponseDto> Handle(ProcessFaceRecognitionCommand request, CancellationToken cancellationToken)
        {
            // 1. Kiểm tra device có tồn tại và online không
            if (!Guid.TryParse(request.DeviceId, out var deviceGuid))
            {
                _logger.LogWarning("Invalid device ID format: {DeviceId}", request.DeviceId);
                return new FaceRecognitionResponseDto
                {
                    Status = "Failed",
                    Message = "Thiết bị không tồn tại",
                    ConfidenceScore = 0
                };
            }

            var device = await _deviceRepository.GetByIdAsync(deviceGuid, cancellationToken);

            if (device == null)
            {
                _logger.LogWarning("Device not found: {DeviceId}", request.DeviceId);
                return new FaceRecognitionResponseDto
                {
                    Status = "Failed",
                    Message = "Thiết bị không tồn tại",
                    ConfidenceScore = 0
                };
            }

            if (device.Status != "Online")
            {
                _logger.LogWarning("Device is offline: {DeviceId}", request.DeviceId);
                return new FaceRecognitionResponseDto
                {
                    Status = "Failed",
                    Message = "Thiết bị đang offline",
                    ConfidenceScore = 0
                };
            }

            // 2. Tạo device log
            var deviceLog = new AttendanceDeviceLog
            {
                Id = Guid.NewGuid(),
                DeviceId = device.Id,
                DeviceCode = device.Id.ToString(), 
                CapturedAt = request.CapturedAt,
                ProcessingResult = "Processing"
            };
            await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
            await _deviceLogRepository.SaveChangesAsync(cancellationToken);

            try
            {
                // 3. Gọi Python AI Service để nhận diện
                var httpClient = _httpClientFactory.CreateClient("PythonAIService");

                var requestBody = new
                {
                    image_base64 = request.ImageBase64
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync("/api/face-recognition/recognize", content, cancellationToken);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                var aiResult = JsonSerializer.Deserialize<PythonAIRecognitionResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (aiResult == null || aiResult.Embedding == null)
                {
                    throw new Exception("Python AI Service không trả về kết quả");
                }

                // 4. So sánh với database để tìm employee
                // Convert embedding từ response
                float[] embeddingArray;
                if (aiResult.Embedding is JsonElement jsonElement && jsonElement.ValueKind == JsonValueKind.Array)
                {
                    embeddingArray = jsonElement.EnumerateArray().Select(x => (float)x.GetDouble()).ToArray();
                }
                else
                {
                    throw new Exception("Format embedding không hợp lệ");
                }

                // Lấy tất cả face templates active với Employee included
                var faceTemplates = await _faceTemplateRepository.GetActiveTemplatesWithEmployeeAsync(cancellationToken);

                Employee? matchedEmployee = null;
                float bestConfidence = 0f;
                const float threshold = 0.7f; // Ngưỡng confidence tối thiểu

                foreach (var template in faceTemplates)
                {
                    // Convert template embedding từ byte[] sang float[]
                    var templateArray = new float[template.EmbeddingVector.Length / sizeof(float)];
                    Buffer.BlockCopy(template.EmbeddingVector, 0, templateArray, 0, template.EmbeddingVector.Length);

                    // Tính cosine similarity (hoặc euclidean distance)
                    var similarity = CalculateCosineSimilarity(embeddingArray, templateArray);

                    if (similarity > bestConfidence && similarity >= threshold)
                    {
                        bestConfidence = similarity;
                        matchedEmployee = template.Employee;
                    }
                }

                // 5. Cập nhật device log
                if (matchedEmployee != null)
                {
                    deviceLog.EmployeeId = matchedEmployee.Id;
                    deviceLog.Confidence = bestConfidence;
                    deviceLog.ProcessingResult = "Success";
                }
                else
                {
                    deviceLog.ProcessingResult = "Failed";
                    deviceLog.ErrorMessage = "Không nhận diện được khuôn mặt";
                }

                _deviceLogRepository.Update(deviceLog);
                await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                // 6. Trả về kết quả
                if (matchedEmployee != null)
                {
                    _logger.LogInformation("Face recognized: Employee {EmployeeCode} with confidence {Confidence}", 
                        matchedEmployee.EmployeeCode, bestConfidence);

                    return new FaceRecognitionResponseDto
                    {
                        EmployeeId = matchedEmployee.Id,
                        EmployeeCode = matchedEmployee.EmployeeCode,
                        EmployeeName = matchedEmployee.FullName,
                        ConfidenceScore = bestConfidence,
                        Status = "Success",
                        Message = $"Nhận diện thành công: {matchedEmployee.FullName}",
                        DeviceLogId = deviceLog.Id
                    };
                }
                else
                {
                    return new FaceRecognitionResponseDto
                    {
                        Status = "Failed",
                        Message = "Không nhận diện được khuôn mặt",
                        ConfidenceScore = bestConfidence,
                        DeviceLogId = deviceLog.Id
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing face recognition for device: {DeviceId}", request.DeviceId);
                
                deviceLog.ProcessingResult = "Error";
                deviceLog.ErrorMessage = ex.Message;
                _deviceLogRepository.Update(deviceLog);
                await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                return new FaceRecognitionResponseDto
                {
                    Status = "Error",
                    Message = "Đã xảy ra lỗi khi xử lý nhận diện khuôn mặt",
                    ConfidenceScore = 0,
                    DeviceLogId = deviceLog.Id
                };
            }
        }

        /// <summary>
        /// Tính cosine similarity giữa 2 vectors
        /// </summary>
        private float CalculateCosineSimilarity(float[] vector1, float[] vector2)
        {
            if (vector1.Length != vector2.Length)
                return 0f;

            float dotProduct = 0f;
            float magnitude1 = 0f;
            float magnitude2 = 0f;

            for (int i = 0; i < vector1.Length; i++)
            {
                dotProduct += vector1[i] * vector2[i];
                magnitude1 += vector1[i] * vector1[i];
                magnitude2 += vector2[i] * vector2[i];
            }

            magnitude1 = (float)Math.Sqrt(magnitude1);
            magnitude2 = (float)Math.Sqrt(magnitude2);

            if (magnitude1 == 0 || magnitude2 == 0)
                return 0f;

            return dotProduct / (magnitude1 * magnitude2);
        }

        private class PythonAIRecognitionResponse
        {
            public object? Embedding { get; set; }
            public float? QualityScore { get; set; }
        }
    }
}
