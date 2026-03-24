using Hrms.Application.DTOs.Reports;
using Hrms.Application.Features.Reports.Common;
using Hrms.Application.Interface;
using MediatR;

namespace Hrms.Application.Features.Reports.Queries
{
    public class GetDepartmentReportQueryHandler : IRequestHandler<GetDepartmentReportQuery, List<DepartmentAttendanceReportDto>>
    {
        private readonly IAttendanceSummaryRepository _attendanceSummaryRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IManagementRepository _managementRepository;

        public GetDepartmentReportQueryHandler(
            IAttendanceSummaryRepository attendanceSummaryRepository,
            IEmployeeRepository employeeRepository,
            IDepartmentRepository departmentRepository,
            IManagementRepository managementRepository)
        {
            _attendanceSummaryRepository = attendanceSummaryRepository;
            _employeeRepository = employeeRepository;
            _departmentRepository = departmentRepository;
            _managementRepository = managementRepository;
        }

        public async Task<List<DepartmentAttendanceReportDto>> Handle(GetDepartmentReportQuery request, CancellationToken cancellationToken)
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
                    return new List<DepartmentAttendanceReportDto>();
                }
            }

            var today = DateTime.UtcNow.Date;
            var departments = (await _departmentRepository.GetAllAsync(cancellationToken)).ToList();
            if (allowedDepartmentIds != null)
            {
                departments = departments.Where(d => allowedDepartmentIds.Contains(d.Id)).ToList();
            }

            var employees = (await _employeeRepository.GetAllAsync(cancellationToken))
                .Where(e => e.IsActive && e.DepartmentId.HasValue)
                .ToList();

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

            var employeesByDepartment = employees
                .GroupBy(e => e.DepartmentId!.Value)
                .ToDictionary(g => g.Key, g => g.Select(x => x.Id).ToList());

            var result = departments
                .OrderBy(d => d.Name)
                .Select(department =>
                {
                    var depEmployeeIds = employeesByDepartment.TryGetValue(department.Id, out var ids)
                        ? ids
                        : new List<Guid>();

                    var present = depEmployeeIds.Count(id =>
                        todaySummaries.TryGetValue(id, out var summary) && ReportMetricsHelper.IsPresent(summary));

                    var late = depEmployeeIds.Count(id =>
                        todaySummaries.TryGetValue(id, out var summary) && ReportMetricsHelper.IsLate(summary));

                    return new DepartmentAttendanceReportDto
                    {
                        DepartmentId = department.Id,
                        Department = department.Name,
                        TotalEmployees = depEmployeeIds.Count,
                        Present = present,
                        Late = late
                    };
                })
                .ToList();

            return result;
        }
    }
}
