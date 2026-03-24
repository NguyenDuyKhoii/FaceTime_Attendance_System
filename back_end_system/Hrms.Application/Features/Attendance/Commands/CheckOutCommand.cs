using MediatR;
using Hrms.Application.DTOs.Attendance;

namespace Hrms.Application.Features.Attendance.Commands
{
    /// <summary>
    /// Command xử lý check-out
    /// </summary>
    public class CheckOutCommand : IRequest<CheckInResponseDto> // Reuse CheckInResponseDto
    {
        public Guid EmployeeId { get; set; }
        public string? DeviceId { get; set; }
        public DateTime? CheckOutTime { get; set; }
    }
}
