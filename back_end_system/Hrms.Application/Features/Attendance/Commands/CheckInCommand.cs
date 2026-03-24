using MediatR;
using Hrms.Application.DTOs.Attendance;

namespace Hrms.Application.Features.Attendance.Commands
{
    /// <summary>
    /// Command xử lý check-in
    /// </summary>
    public class CheckInCommand : IRequest<CheckInResponseDto>
    {
        public Guid EmployeeId { get; set; }
        public string? DeviceId { get; set; }
        public DateTime? CheckInTime { get; set; }
    }
}
