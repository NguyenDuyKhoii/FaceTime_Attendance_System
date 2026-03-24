using MediatR;
using Hrms.Application.DTOs.Attendance;

namespace Hrms.Application.Features.Attendance.Queries
{
    public class GetAttendanceHistoryQuery : IRequest<AttendanceHistoryListDto>
    {
        public Guid? EmployeeId { get; set; }
        public int? DepartmentId { get; set; }
        public int? ProductionLineId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        // User info for Authorization (Admin, HR, Manager)
        public Guid CurrentUserId { get; set; }
        public string CurrentUserRole { get; set; } = null!;
    }
}
