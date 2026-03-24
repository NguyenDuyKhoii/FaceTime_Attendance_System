using Hrms.Application.DTOs.Reports;
using Hrms.Application.Features.Reports.Common;
using Hrms.Application.Interface;
using MediatR;

namespace Hrms.Application.Features.Reports.Queries
{
    public class GetProductionLineReportQueryHandler : IRequestHandler<GetProductionLineReportQuery, List<ProductionLineAttendanceReportDto>>
    {
        private readonly IAttendanceSummaryRepository _attendanceSummaryRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IShiftAssignmentRepository _shiftAssignmentRepository;
        private readonly IProductionLineRepository _productionLineRepository;
        private readonly IManagementRepository _managementRepository;

        public GetProductionLineReportQueryHandler(
            IAttendanceSummaryRepository attendanceSummaryRepository,
            IEmployeeRepository employeeRepository,
            IShiftAssignmentRepository shiftAssignmentRepository,
            IProductionLineRepository productionLineRepository,
            IManagementRepository managementRepository)
        {
            _attendanceSummaryRepository = attendanceSummaryRepository;
            _employeeRepository = employeeRepository;
            _shiftAssignmentRepository = shiftAssignmentRepository;
            _productionLineRepository = productionLineRepository;
            _managementRepository = managementRepository;
        }

        public async Task<List<ProductionLineAttendanceReportDto>> Handle(GetProductionLineReportQuery request, CancellationToken cancellationToken)
        {
            if (!request.IsAdminOrHr && !request.IsManager)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập báo cáo.");
            }

            HashSet<int>? allowedDepartmentIds = null;
            if (request.IsManager)
            {
                if (!request.RequestUserId.HasValue)
                {
                    throw new UnauthorizedAccessException("Không xác định được người dùng hiện tại.");
                }

                allowedDepartmentIds = await ReportScopeHelper.ResolveAllowedDepartmentsAsync(
                    _managementRepository,
                    request.RequestUserId.Value,
                    DateTime.UtcNow,
                    cancellationToken);

                if (allowedDepartmentIds.Count == 0)
                {
                    return new List<ProductionLineAttendanceReportDto>();
                }
            }

            if (request.DepartmentId.HasValue
                && allowedDepartmentIds != null
                && !allowedDepartmentIds.Contains(request.DepartmentId.Value))
            {
                throw new UnauthorizedAccessException("Manager chỉ được xem dữ liệu phòng ban được phân quyền.");
            }

            var today = DateTime.UtcNow.Date;
            var employees = (await _employeeRepository.GetAllAsync(cancellationToken))
                .Where(e => e.IsActive)
                .ToList();

            if (request.DepartmentId.HasValue)
            {
                employees = employees
                    .Where(e => e.DepartmentId == request.DepartmentId.Value)
                    .ToList();
            }

            if (allowedDepartmentIds != null)
            {
                employees = employees
                    .Where(e => e.DepartmentId.HasValue && allowedDepartmentIds.Contains(e.DepartmentId.Value))
                    .ToList();
            }

            var employeeIds = employees.Select(e => e.Id).ToHashSet();
            var todaySummaries = (await _attendanceSummaryRepository.GetAllAsync(cancellationToken))
                .Where(s => s.RecordDate.Date == today && employeeIds.Contains(s.EmployeeId))
                .GroupBy(s => s.EmployeeId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.CreatedAt).First());

            var lines = (await _productionLineRepository.GetAllAsync(cancellationToken)).ToList();
            if (request.DepartmentId.HasValue)
            {
                lines = lines.Where(l => l.DepartmentId == request.DepartmentId.Value).ToList();
            }

            if (allowedDepartmentIds != null)
            {
                lines = lines.Where(l => allowedDepartmentIds.Contains(l.DepartmentId)).ToList();
            }

            var currentAssignments = (await _shiftAssignmentRepository.GetAllWithDetailsAsync(cancellationToken))
                .Where(sa => employeeIds.Contains(sa.EmployeeId)
                    && sa.FromDate.Date <= today
                    && sa.ToDate.Date >= today)
                .GroupBy(sa => sa.EmployeeId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.FromDate).FirstOrDefault());

            var report = lines
                .OrderBy(l => l.LineName)
                .Select(line =>
                {
                    var lineEmployeeIds = currentAssignments
                        .Where(kvp => kvp.Value?.ProductionLineId == line.Id)
                        .Select(kvp => kvp.Key)
                        .ToHashSet();

                    var present = lineEmployeeIds.Count(id =>
                        todaySummaries.TryGetValue(id, out var summary) && ReportMetricsHelper.IsPresent(summary));

                    var late = lineEmployeeIds.Count(id =>
                        todaySummaries.TryGetValue(id, out var summary) && ReportMetricsHelper.IsLate(summary));

                    return new ProductionLineAttendanceReportDto
                    {
                        ProductionLineId = line.Id,
                        ProductionLine = line.LineName,
                        TotalEmployees = lineEmployeeIds.Count,
                        Present = present,
                        Late = late
                    };
                })
                .ToList();

            return report;
        }
    }
}
