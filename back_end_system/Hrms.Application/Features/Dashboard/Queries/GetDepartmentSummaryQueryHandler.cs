using MediatR;
using Hrms.Application.DTOs.Dashboard;
using Hrms.Application.Interface;
using Hrms.Domain.Enums;

namespace Hrms.Application.Features.Dashboard.Queries
{
    public class GetDepartmentSummaryQueryHandler : IRequestHandler<GetDepartmentSummaryQuery, IEnumerable<DepartmentSummaryDto>>
    {
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IAttendanceRecordRepository _attendanceRecordRepository;
        private readonly IManagementRepository _managementRepository;

        public GetDepartmentSummaryQueryHandler(
            IDepartmentRepository departmentRepository,
            IEmployeeRepository employeeRepository,
            IAttendanceRecordRepository attendanceRecordRepository,
            IManagementRepository managementRepository)
        {
            _departmentRepository = departmentRepository;
            _employeeRepository = employeeRepository;
            _attendanceRecordRepository = attendanceRecordRepository;
            _managementRepository = managementRepository;
        }

        public async Task<IEnumerable<DepartmentSummaryDto>> Handle(GetDepartmentSummaryQuery request, CancellationToken cancellationToken)
        {
            var tzInfo = TimeZoneInfo.FindSystemTimeZoneById(
                Environment.OSVersion.Platform == PlatformID.Win32NT ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");
            var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tzInfo);
            var today = now.Date;

            // 1. Lấy danh sách departments được phép xem
            var allDepartments = await _departmentRepository.GetAllAsync(cancellationToken);
            IEnumerable<Hrms.Domain.Entities.Department> departments;
            
            if (request.CurrentUserRole == "Manager")
            {
                var managementAssignments = await _managementRepository.GetByUserIdAsync(request.CurrentUserId, cancellationToken);
                var assignedDeptIds = managementAssignments.Select(m => m.DepartmentId).Distinct().ToList();
                departments = allDepartments.Where(d => assignedDeptIds.Contains(d.Id));
            }
            else
            {
                departments = allDepartments;
            }

            var employees = (await _employeeRepository.GetAllAsync(cancellationToken)).Where(e => e.IsActive).ToList();
            var attendanceRecords = (await _attendanceRecordRepository.GetAllAsync(cancellationToken))
                                    .Where(a => a.WorkDate.Date == today).ToList();

            var result = new List<DepartmentSummaryDto>();

            foreach (var dept in departments)
            {
                var deptEmployees = employees.Where(e => e.DepartmentId == dept.Id).ToList();
                var deptEmployeeIds = deptEmployees.Select(e => e.Id).ToList();
                
                var deptRecords = attendanceRecords.Where(a => deptEmployeeIds.Contains(a.EmployeeId)).ToList();

                var presentCount = deptRecords
                    .Where(a => a.CheckInTime.HasValue)
                    .Select(a => a.EmployeeId)
                    .Distinct()
                    .Count();

                var lateCount = deptRecords.Count(a => a.Status == AttendanceStatus.Late);

                result.Add(new DepartmentSummaryDto
                {
                    Department = dept.Name,
                    TotalEmployees = deptEmployees.Count,
                    Present = presentCount,
                    Late = lateCount
                });
            }

            return result;
        }
    }
}
