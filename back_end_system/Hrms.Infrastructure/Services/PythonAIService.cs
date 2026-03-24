using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Hrms.Application.DTOs.PythonAI;
using Hrms.Application.Interface;

namespace Hrms.Infrastructure.Services
{
    /// <summary>
    /// Implementation của IPythonAIService
    /// Gọi Python AI Service qua HTTP
    /// </summary>
    public class PythonAIService : IPythonAIService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<PythonAIService> _logger;

        public PythonAIService(IHttpClientFactory httpClientFactory, ILogger<PythonAIService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<PythonEnrollResponseDto> EnrollFaceAsync(
            string personId, 
            string name, 
            string imageBase64, 
            CancellationToken cancellationToken = default)
        {
            try
            {
                var httpClient = _httpClientFactory.CreateClient("PythonAIService");

                // Python AI Service expects multipart/form-data
                using var content = new MultipartFormDataContent();
                
                // Add form fields
                content.Add(new StringContent(personId), "person_id");
                content.Add(new StringContent(name), "name");

                // Convert base64 to byte array and add as file
                var imageBytes = ConvertBase64ToBytes(imageBase64);
                var imageContent = new ByteArrayContent(imageBytes);
                imageContent.Headers.ContentType = MediaTypeHeaderValue.Parse("image/jpeg");
                content.Add(imageContent, "image", "face.jpg");

                _logger.LogInformation("Enrolling face for person_id: {PersonId}, name: {Name}", personId, name);

                var response = await httpClient.PostAsync("api/enroll", content, cancellationToken);
                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

                _logger.LogDebug("Python AI enroll response: {Response}", responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Python AI enroll failed with status {StatusCode}: {Response}", 
                        response.StatusCode, responseContent);
                    
                    // Try to parse error response
                    var errorResponse = JsonSerializer.Deserialize<PythonEnrollResponseDto>(responseContent, 
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    
                    return errorResponse ?? new PythonEnrollResponseDto 
                    { 
                        Ok = false, 
                        Reason = $"HTTP {response.StatusCode}: {responseContent}" 
                    };
                }

                var result = JsonSerializer.Deserialize<PythonEnrollResponseDto>(responseContent, 
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return result ?? new PythonEnrollResponseDto { Ok = false, Reason = "Invalid response format" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Python AI enroll API for person_id: {PersonId}", personId);
                return new PythonEnrollResponseDto 
                { 
                    Ok = false, 
                    Reason = $"Exception: {ex.Message}" 
                };
            }
        }

        public async Task<PythonRecognizeResponseDto> RecognizeFaceAsync(
            string? deviceId, 
            string imageBase64, 
            CancellationToken cancellationToken = default)
        {
            try
            {
                var httpClient = _httpClientFactory.CreateClient("PythonAIService");

                // Python AI Service expects multipart/form-data
                using var content = new MultipartFormDataContent();
                
                // Add device_id if provided
                if (!string.IsNullOrEmpty(deviceId))
                {
                    content.Add(new StringContent(deviceId), "device_id");
                }

                // Convert base64 to byte array and add as file
                var imageBytes = ConvertBase64ToBytes(imageBase64);
                var imageContent = new ByteArrayContent(imageBytes);
                imageContent.Headers.ContentType = MediaTypeHeaderValue.Parse("image/jpeg");
                content.Add(imageContent, "image", "capture.jpg");

                _logger.LogInformation("[BE -> Python] Đang gửi yêu cầu nhận diện cho thiết bị: {DeviceId}", deviceId ?? "N/A");
                _logger.LogInformation("[BE -> Python] URL mục tiêu: {Url}", httpClient.BaseAddress + "api/recognize_face");

                var startTime = DateTime.Now;
                var response = await httpClient.PostAsync("api/recognize_face", content, cancellationToken);
                var duration = DateTime.Now - startTime;
                
                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

                _logger.LogInformation("[Python -> BE] Nhận phản hồi sau {Duration}ms. Status: {Status}", 
                    (int)duration.TotalMilliseconds, response.StatusCode);
                _logger.LogDebug("[Python -> BE] Nội dung: {Response}", responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Python AI recognize failed with status {StatusCode}: {Response}", 
                        response.StatusCode, responseContent);
                    
                    // Try to parse error response
                    var errorResponse = JsonSerializer.Deserialize<PythonRecognizeResponseDto>(responseContent, 
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    
                    return errorResponse ?? new PythonRecognizeResponseDto 
                    { 
                        Ok = false, 
                        Reason = $"HTTP {response.StatusCode}: {responseContent}" 
                    };
                }

                var result = JsonSerializer.Deserialize<PythonRecognizeResponseDto>(responseContent, 
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return result ?? new PythonRecognizeResponseDto { Ok = false, Reason = "Invalid response format" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Python AI recognize API");
                return new PythonRecognizeResponseDto 
                { 
                    Ok = false, 
                    Reason = $"Exception: {ex.Message}" 
                };
            }
        }

        public async Task<PythonGetImagesResponseDto> GetEnrolledImagesAsync(string personId, CancellationToken cancellationToken = default)
        {
            try
            {
                var httpClient = _httpClientFactory.CreateClient("PythonAIService");
                var response = await httpClient.GetAsync($"api/get_images/{personId}", cancellationToken);
                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Python AI get_images failed with status {StatusCode}: {Response}", response.StatusCode, responseContent);
                    return new PythonGetImagesResponseDto { Ok = false };
                }

                var result = JsonSerializer.Deserialize<PythonGetImagesResponseDto>(responseContent, 
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return result ?? new PythonGetImagesResponseDto { Ok = false };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Python AI get_images API");
                return new PythonGetImagesResponseDto { Ok = false };
            }
        }

        /// <summary>
        /// Convert base64 string to byte array
        /// Handles both with and without "data:image/jpeg;base64," prefix
        /// </summary>
        private byte[] ConvertBase64ToBytes(string base64String)
        {
            // Remove prefix if exists
            if (base64String.Contains(","))
            {
                base64String = base64String.Split(',')[1];
            }

            return Convert.FromBase64String(base64String);
        }
    }
}
