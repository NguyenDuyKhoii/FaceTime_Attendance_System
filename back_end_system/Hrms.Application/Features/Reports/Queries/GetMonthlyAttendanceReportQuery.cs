using Hrms.Application.DTOs.Reports;
using MediatR;

namespace Hrms.Application.Features.Reports.Queries
{
    public class GetMonthlyAttendanceReportQuery : IRequest<List<MonthlyAttendanceReportItemDto>>
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public int? DepartmentId { get; set; }
        public Guid? RequestUserId { get; set; }
        public bool IsAdminOrHr { get; set; }
        public bool IsManager { get; set; }
    }
}
