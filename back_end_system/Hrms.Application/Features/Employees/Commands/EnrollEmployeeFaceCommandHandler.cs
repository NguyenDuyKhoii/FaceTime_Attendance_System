using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Application.DTOs.Employee;

namespace Hrms.Application.Features.Employees.Commands
{
    /// <summary>
    /// Handler xử lý enrollment khuôn mặt nhân viên
    /// </summary>
    public class EnrollEmployeeFaceCommandHandler : IRequestHandler<EnrollEmployeeFaceCommand, EnrollEmployeeFaceResponseDto>
    {
        private readonly IPythonAIService _pythonAIService;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IFaceTemplateRepository _faceTemplateRepository;
        private readonly ILogger<EnrollEmployeeFaceCommandHandler> _logger;
 
        public EnrollEmployeeFaceCommandHandler(
            IPythonAIService pythonAIService,
            IEmployeeRepository employeeRepository,
            IFaceTemplateRepository faceTemplateRepository,
            ILogger<EnrollEmployeeFaceCommandHandler> logger)
        {
            _pythonAIService = pythonAIService;
            _employeeRepository = employeeRepository;
            _faceTemplateRepository = faceTemplateRepository;
            _logger = logger;
        }
 
        public async Task<EnrollEmployeeFaceResponseDto> Handle(EnrollEmployeeFaceCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Enrolling face for employee: {EmployeeId}", request.EmployeeId);
 
            // 1. Validate employee exists
            var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId, cancellationToken);
            
            if (employee == null)
            {
                _logger.LogWarning("Employee not found: {EmployeeId}", request.EmployeeId);
                return new EnrollEmployeeFaceResponseDto
                {
                    Success = false,
                    Message = "Không tìm thấy nhân viên"
                };
            }
 
            // 2. Gọi Python AI Service để enroll
            // Sử dụng EmployeeCode làm person_id
            var enrollResult = await _pythonAIService.EnrollFaceAsync(
                employee.EmployeeCode,
                employee.FullName,
                request.ImageBase64,
                cancellationToken);
 
            // 3. Kiểm tra kết quả
            if (!enrollResult.Ok)
            {
                _logger.LogError("Python AI enrollment failed for employee {EmployeeCode}: {Reason}", 
                    employee.EmployeeCode, enrollResult.Reason);

                string friendlyMessage = enrollResult.Reason switch
                {
                    "REQUIRE_EXACTLY_ONE_FACE" => "Yêu cầu chính xác 1 khuôn mặt trong ảnh (không tìm thấy hoặc có quá nhiều mặt)",
                    "INVALID_IMAGE" => "Dữ liệu hình ảnh không hợp lệ hoặc bị lỗi",
                    _ => enrollResult.Reason ?? "Lỗi khi đăng ký khuôn mặt"
                };

                return new EnrollEmployeeFaceResponseDto
                {
                    Success = false,
                    Message = friendlyMessage,
                    EmployeeCode = employee.EmployeeCode,
                    EmployeeName = employee.FullName
                };
            }
 
            // 4. Lưu FaceTemplate vào SQL Server
            var existingTemplate = await _faceTemplateRepository.GetByEmployeeIdAsync(employee.Id, cancellationToken);
            if (existingTemplate != null)
            {
                existingTemplate.ImagePath = request.ImageBase64; 
                existingTemplate.RegisteredDate = DateTime.UtcNow;
                existingTemplate.IsActive = true;
                existingTemplate.Version++;
                _faceTemplateRepository.Update(existingTemplate);
            }
            else
            {
                var newTemplate = new FaceTemplate
                {
                    EmployeeId = employee.Id,
                    ImagePath = request.ImageBase64,
                    EmbeddingVector = new byte[0],
                    RegisteredDate = DateTime.UtcNow,
                    IsActive = true,
                    Version = 1
                };
                await _faceTemplateRepository.AddAsync(newTemplate, cancellationToken);
            }
            
            await _faceTemplateRepository.SaveChangesAsync(cancellationToken);
 
            // 5. Success
            _logger.LogInformation("Successfully enrolled face for employee {EmployeeCode} and saved to SQL Server", employee.EmployeeCode);
 
            return new EnrollEmployeeFaceResponseDto
            {
                Success = true,
                Message = "Đăng ký khuôn mặt thành công và đã lưu vào hệ thống",
                EmployeeCode = employee.EmployeeCode,
                EmployeeName = employee.FullName,
                Label = enrollResult.Label
            };
        }
    }
}
