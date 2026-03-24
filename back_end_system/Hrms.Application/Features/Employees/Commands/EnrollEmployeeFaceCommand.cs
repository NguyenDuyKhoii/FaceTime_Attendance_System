using Hrms.Application.DTOs.Employee;
using MediatR;

namespace Hrms.Application.Features.Employees.Commands
{
    /// <summary>
    /// Command để enroll (đăng ký) khuôn mặt nhân viên vào Python AI Service
    /// </summary>
    public class EnrollEmployeeFaceCommand : IRequest<EnrollEmployeeFaceResponseDto>
    {
        public Guid EmployeeId { get; set; }
        public string ImageBase64 { get; set; } = string.Empty;
    }   
}
