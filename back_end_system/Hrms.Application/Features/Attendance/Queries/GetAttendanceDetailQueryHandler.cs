using MediatR;
using Microsoft.EntityFrameworkCore;
using Hrms.Application.DTOs.Attendance;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using System.Linq;

namespace Hrms.Application.Features.Attendance.Queries
{
    public class GetAttendanceDetailQueryHandler : IRequestHandler<GetAttendanceDetailQuery, AttendanceDetailDto?>
    {
        private readonly IAttendanceRecordRepository _attendanceRecordRepository;
        private readonly IAttendanceSummaryRepository _attendanceSummaryRepository;
        private readonly IAttendanceDeviceLogRepository _deviceLogRepository;
        private readonly IShiftAssignmentRepository _shiftAssignmentRepository;
        private readonly IManagementRepository _managementRepository;

        public GetAttendanceDetailQueryHandler(
            IAttendanceRecordRepository attendanceRecordRepository,
            IAttendanceSummaryRepository attendanceSummaryRepository,
            IAttendanceDeviceLogRepository deviceLogRepository,
            IShiftAssignmentRepository shiftAssignmentRepository,
            IManagementRepository managementRepository)
        {
            _attendanceRecordRepository = attendanceRecordRepository;
            _attendanceSummaryRepository = attendanceSummaryRepository;
            _deviceLogRepository = deviceLogRepository;
            _shiftAssignmentRepository = shiftAssignmentRepository;
            _managementRepository = managementRepository;
        }

        public async Task<AttendanceDetailDto?> Handle(GetAttendanceDetailQuery request, CancellationToken cancellationToken)
        {
            var record = await _attendanceRecordRepository.Query()
                .Include(a => a.Employee)
                    .ThenInclude(e => e.Department)
                .Include(a => a.Shift)
                .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

            if (record == null) return null;

            // 1. Authorization Check
            if (request.CurrentUserRole.Equals("Manager", StringComparison.OrdinalIgnoreCase))
            {
                var isManaged = await _managementRepository.Query()
                    .AnyAsync(m => m.UserId == request.CurrentUserId && 
                                  m.DepartmentId == record.Employee.DepartmentId && 
                                  m.IsActive, cancellationToken);
                
                if (!isManaged) return null;
            }
            else if (!request.CurrentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) && 
                     !request.CurrentUserRole.Equals("HR", StringComparison.OrdinalIgnoreCase))
            {
                // Only see own record if Employee (optional, assuming current logic)
                if (record.EmployeeId != request.CurrentUserId) return null;
            }

            // 2. Fetch Additional Details
            
            // Late Minutes from Summary
            var summary = await _attendanceSummaryRepository.Query()
                .FirstOrDefaultAsync(s => s.EmployeeId == record.EmployeeId && s.RecordDate.Date == record.WorkDate.Date, cancellationToken);

            // Production Line and Shift Assignment Info
            var assignment = await _shiftAssignmentRepository.Query()
                .Include(sa => sa.ProductionLine)
                .FirstOrDefaultAsync(sa => 
                    sa.EmployeeId == record.EmployeeId && 
                    sa.ShiftId == record.ShiftId && 
                    record.WorkDate >= sa.FromDate && 
                    record.WorkDate <= sa.ToDate, cancellationToken);

            // Find Device Log for the check-in (match by employee and closest time)
            AttendanceDeviceLog? deviceLog = null;
            if (record.CheckInTime.HasValue)
            {
                var logs = await _deviceLogRepository.Query()
                    .Include(l => l.Device)
                    .Where(l => l.EmployeeId == record.EmployeeId && 
                               l.CapturedAt >= record.CheckInTime.Value.AddMinutes(-1) && 
                               l.CapturedAt <= record.CheckInTime.Value.AddMinutes(1))
                    .ToListAsync(cancellationToken);

                deviceLog = logs
                    .OrderBy(l => Math.Abs((l.CapturedAt - record.CheckInTime.Value).TotalSeconds))
                    .FirstOrDefault();
            }

            // Calculate Early Leave Minutes if not present
            int earlyLeaveMinutes = 0;
            if (record.CheckOutTime.HasValue && record.Shift != null)
            {
                var shiftEnd = record.WorkDate.Date.Add(record.Shift.EndTime);
                if (record.CheckOutTime.Value < shiftEnd)
                {
                    earlyLeaveMinutes = (int)(shiftEnd - record.CheckOutTime.Value).TotalMinutes;
                }
            }

            // 3. Build DTO
            return new AttendanceDetailDto
            {
                Id = record.Id,
                EmployeeId = record.EmployeeId,
                EmployeeName = record.Employee.FullName,
                Department = record.Employee.Department?.Name,
                ProductionLine = assignment?.ProductionLine?.LineName,
                WorkDate = record.WorkDate,
                CheckInTime = record.CheckInTime,
                CheckOutTime = record.CheckOutTime,
                LateMinutes = summary?.LateMinutes ?? 0,
                EarlyLeaveMinutes = earlyLeaveMinutes,
                TotalHours = record.TotalHours,
                Status = record.Status.ToString(),
                DeviceId = deviceLog?.Device?.DeviceName ?? deviceLog?.DeviceCode,
                Location = deviceLog?.Device?.LocationDesc,
                ConfidenceScore = deviceLog?.Confidence,
                Source = record.Source.ToString(),
                Note = record.Note,
                CreatedAt = record.CreatedAt
            };
        }
    }
}
