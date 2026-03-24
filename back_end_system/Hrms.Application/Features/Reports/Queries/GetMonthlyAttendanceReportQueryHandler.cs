using Hrms.Application.DTOs.Reports;
using Hrms.Application.Features.Reports.Common;
using Hrms.Application.Interface;
using Hrms.Domain.Enums;
using MediatR;

namespace Hrms.Application.Features.Reports.Queries
{
    public class GetMonthlyAttendanceReportQueryHandler : IRequestHandler<GetMonthlyAttendanceReportQuery, List<MonthlyAttendanceReportItemDto>>
    {
        private readonly IAttendanceSummaryRepository _attendanceSummaryRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IShiftAssignmentRepository _shiftAssignmentRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IProductionLineRepository _productionLineRepository;
        private readonly IShiftRepository _shiftRepository;
        private readonly IManagementRepository _managementRepository;

        public GetMonthlyAttendanceReportQueryHandler(
            IAttendanceSummaryRepository attendanceSummaryRepository,
            IEmployeeRepository employeeRepository,
            IShiftAssignmentRepository shiftAssignmentRepository,
            IDepartmentRepository departmentRepository,
            IProductionLineRepository productionLineRepository,
            IShiftRepository shiftRepository,
            IManagementRepository managementRepository)
        {
            _attendanceSummaryRepository = attendanceSummaryRepository;
            _employeeRepository = employeeRepository;
            _shiftAssignmentRepository = shiftAssignmentRepository;
            _departmentRepository = departmentRepository;
            _productionLineRepository = productionLineRepository;
            _shiftRepository = shiftRepository;
            _managementRepository = managementRepository;
        }

        public async Task<List<MonthlyAttendanceReportItemDto>> Handle(GetMonthlyAttendanceReportQuery request, CancellationToken cancellationToken)
        {
            if (request.Month is < 1 or > 12)
            {
                throw new ArgumentException("Month phải nằm trong khoảng 1..12.");
            }

            if (request.Year is < 2000 or > 3000)
            {
                throw new ArgumentException("Year không hợp lệ.");
            }

            if (!request.IsAdminOrHr && !request.IsManager)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập báo cáo.");
            }

            var fromDate = new DateTime(request.Year, request.Month, 1);
            var toDate = fromDate.AddMonths(1).AddDays(-1);

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
                    fromDate,
                    cancellationToken);

                if (allowedDepartmentIds.Count == 0)
                {
                    return new List<MonthlyAttendanceReportItemDto>();
                }
            }

            if (request.DepartmentId.HasValue
                && allowedDepartmentIds != null
                && !allowedDepartmentIds.Contains(request.DepartmentId.Value))
            {
                throw new UnauthorizedAccessException("Manager chỉ được xem dữ liệu phòng ban được phân quyền.");
            }

            var summaries = (await _attendanceSummaryRepository.GetAllAsync(cancellationToken))
                .Where(s => s.RecordDate.Date >= fromDate.Date && s.RecordDate.Date <= toDate.Date)
                .ToList();

            var employees = (await _employeeRepository.GetAllAsync(cancellationToken))
                .Where(e => e.IsActive)
                .ToList();

            var departments = (await _departmentRepository.GetAllAsync(cancellationToken)).ToList();
            var lines = (await _productionLineRepository.GetAllAsync(cancellationToken)).ToList();
            var shiftsById = (await _shiftRepository.GetAllAsync(cancellationToken))
                .ToDictionary(s => s.Id, s => s);

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

            var employeesById = employees.ToDictionary(e => e.Id, e => e);
            var summariesByEmployee = summaries
                .Where(s => employeesById.ContainsKey(s.EmployeeId))
                .GroupBy(s => s.EmployeeId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var shiftAssignments = (await _shiftAssignmentRepository.GetAllWithDetailsAsync(cancellationToken))
                .Where(sa => employeesById.ContainsKey(sa.EmployeeId)
                    && sa.FromDate.Date <= toDate.Date
                    && sa.ToDate.Date >= fromDate.Date)
                .ToList();

            var latestAssignmentsByEmployee = shiftAssignments
                .GroupBy(sa => sa.EmployeeId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(x => x.FromDate).FirstOrDefault());

            var departmentsById = departments.ToDictionary(d => d.Id, d => d.Name);
            var linesById = lines.ToDictionary(l => l.Id, l => l.LineName);

            var result = new List<MonthlyAttendanceReportItemDto>();
            foreach (var employee in employees.OrderBy(e => e.EmployeeCode))
            {
                summariesByEmployee.TryGetValue(employee.Id, out var employeeSummaries);
                employeeSummaries ??= new List<Domain.Entities.AttendanceSummary>();

                var workingDays = employeeSummaries.Count(ReportMetricsHelper.IsPresent);
                var lateCount = employeeSummaries.Count(ReportMetricsHelper.IsLate);
                var earlyLeaveCount = employeeSummaries.Count(s => s.Status == AttendanceStatus.EarlyLeave);
                var lateMinutes = employeeSummaries.Sum(s => s.LateMinutes);
                var earlyLeaveMinutes = employeeSummaries.Sum(s => ReportMetricsHelper.CalculateEarlyLeaveMinutes(s, shiftsById));
                var totalHours = employeeSummaries.Sum(s => s.TotalHours);
                var overtime = employeeSummaries.Sum(s => Math.Max(0d, s.TotalHours - 8d));

                latestAssignmentsByEmployee.TryGetValue(employee.Id, out var latestAssignment);
                var lineName = (latestAssignment?.ProductionLineId.HasValue == true
                    && linesById.TryGetValue(latestAssignment.ProductionLineId.Value, out var name))
                    ? name
                    : "N/A";

                var departmentName = (employee.DepartmentId.HasValue
                    && departmentsById.TryGetValue(employee.DepartmentId.Value, out var depName))
                    ? depName
                    : "N/A";

                result.Add(new MonthlyAttendanceReportItemDto
                {
                    EmployeeId = employee.Id,
                    EmployeeCode = employee.EmployeeCode,
                    EmployeeName = employee.FullName,
                    Department = departmentName,
                    ProductionLine = lineName,
                    WorkingDays = workingDays,
                    Late = lateCount,
                    EarlyLeave = earlyLeaveCount,
                    LateMinutes = lateMinutes,
                    EarlyLeaveMinutes = earlyLeaveMinutes,
                    OvertimeHours = Math.Round(overtime, 2),
                    TotalHours = Math.Round(totalHours, 2)
                });
            }

            return result;
        }
    }
}
