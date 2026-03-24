using Hrms.Application.DTOs.Reports;
using MediatR;

namespace Hrms.Application.Features.Reports.Queries
{
    public class GetProductionLineReportQuery : IRequest<List<ProductionLineAttendanceReportDto>>
    {
        public int? DepartmentId { get; set; }
        public Guid? RequestUserId { get; set; }
        public bool IsAdminOrHr { get; set; }
        public bool IsManager { get; set; }
    }
}
