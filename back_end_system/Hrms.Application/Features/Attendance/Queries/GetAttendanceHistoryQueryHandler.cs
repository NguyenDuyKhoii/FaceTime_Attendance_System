using MediatR;
using Microsoft.EntityFrameworkCore;
using Hrms.Application.DTOs.Attendance;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using System.Linq;

namespace Hrms.Application.Features.Attendance.Queries
{
    public class GetAttendanceHistoryQueryHandler : IRequestHandler<GetAttendanceHistoryQuery, AttendanceHistoryListDto>
    {
        private readonly IAttendanceRecordRepository _attendanceRecordRepository;
        private readonly IAttendanceSummaryRepository _attendanceSummaryRepository;
        private readonly IManagementRepository _managementRepository;
        private readonly IShiftAssignmentRepository _shiftAssignmentRepository;

        public GetAttendanceHistoryQueryHandler(
            IAttendanceRecordRepository attendanceRecordRepository,
            IAttendanceSummaryRepository attendanceSummaryRepository,
            IManagementRepository managementRepository,
            IShiftAssignmentRepository shiftAssignmentRepository)
        {
            _attendanceRecordRepository = attendanceRecordRepository;
            _attendanceSummaryRepository = attendanceSummaryRepository;
            _managementRepository = managementRepository;
            _shiftAssignmentRepository = shiftAssignmentRepository;
        }

        public async Task<AttendanceHistoryListDto> Handle(GetAttendanceHistoryQuery request, CancellationToken cancellationToken)
        {
            var query = _attendanceRecordRepository.Query()
                .Include(a => a.Employee)
                    .ThenInclude(e => e.Department)
                .Include(a => a.Shift)
                .AsQueryable();

            // 1. Authorization Logic
            if (request.CurrentUserRole.Equals("Manager", StringComparison.OrdinalIgnoreCase))
            {
                // Get departments and production lines managed by this user
                var managements = await _managementRepository.Query()
                    .Where(m => m.UserId == request.CurrentUserId && m.IsActive)
                    .ToListAsync(cancellationToken);

                var managedDepartmentIds = managements.Select(m => m.DepartmentId).ToList();
                
                // For now, let's filter by Department IDs from Management
                query = query.Where(a => a.Employee.DepartmentId != null && managedDepartmentIds.Contains(a.Employee.DepartmentId.Value));
            }
            else if (!request.CurrentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) && 
                     !request.CurrentUserRole.Equals("HR", StringComparison.OrdinalIgnoreCase))
            {
                // Unrecognized role or Employee - should not access or only see own
                return new AttendanceHistoryListDto { TotalRecords = 0 };
            }

            // 2. Apply Filters
            if (request.EmployeeId.HasValue)
                query = query.Where(a => a.EmployeeId == request.EmployeeId.Value);

            if (request.DepartmentId.HasValue)
                query = query.Where(a => a.Employee.DepartmentId == request.DepartmentId.Value);

            if (request.FromDate.HasValue)
                query = query.Where(a => a.CheckInTime >= request.FromDate.Value);

            if (request.ToDate.HasValue)
                query = query.Where(a => a.CheckInTime <= request.ToDate.Value);

            // Sorting
            query = query.OrderByDescending(a => a.CheckInTime);

            // Total Records count before pagination
            int totalRecords = await query.CountAsync(cancellationToken);

            // 3. Pagination
            var records = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            // 4. Fetch ShiftAssignments for ProductionLine info
            var employeeIds = records.Select(r => r.EmployeeId).Distinct().ToList();
            var assignments = await _shiftAssignmentRepository.Query()
                .Include(sa => sa.ProductionLine)
                .Where(sa => employeeIds.Contains(sa.EmployeeId))
                .ToListAsync(cancellationToken);

            // 5. Build DTO Response
            var data = records.Select(r => 
            {
                var assignment = assignments.FirstOrDefault(sa => 
                    sa.EmployeeId == r.EmployeeId && 
                    sa.ShiftId == r.ShiftId && 
                    r.WorkDate >= sa.FromDate && 
                    r.WorkDate <= sa.ToDate);

                return new AttendanceHistoryDto
                {
                    Id = r.Id,
                    EmployeeId = r.EmployeeId,
                    EmployeeName = r.Employee.FullName,
                    Department = r.Employee.Department?.Name,
                    ProductionLine = assignment?.ProductionLine?.LineName,
                    CheckInTime = r.CheckInTime,
                    CheckOutTime = r.CheckOutTime,
                    TotalHours = r.TotalHours,
                    Status = r.Status.ToString()
                };
            }).ToList();

            return new AttendanceHistoryListDto
            {
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalRecords = totalRecords,
                Data = data
            };
        }
    }
}
