using MediatR;
using Microsoft.EntityFrameworkCore;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Domain.Enums;
using System;
using System.Linq;

namespace Hrms.Application.Features.Attendance.Commands
{
    public class UpdateAttendanceCommandHandler : IRequestHandler<UpdateAttendanceCommand, bool>
    {
        private readonly IAttendanceRecordRepository _attendanceRecordRepository;
        private readonly IAttendanceSummaryRepository _attendanceSummaryRepository;
        private readonly ISystemLogRepository _systemLogRepository;

        public UpdateAttendanceCommandHandler(
            IAttendanceRecordRepository attendanceRecordRepository,
            IAttendanceSummaryRepository attendanceSummaryRepository,
            ISystemLogRepository systemLogRepository)
        {
            _attendanceRecordRepository = attendanceRecordRepository;
            _attendanceSummaryRepository = attendanceSummaryRepository;
            _systemLogRepository = systemLogRepository;
        }

        public async Task<bool> Handle(UpdateAttendanceCommand request, CancellationToken cancellationToken)
        {
            var record = await _attendanceRecordRepository.Query()
                .Include(a => a.Shift)
                .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

            if (record == null) return false;

            // Preserve old values for logging
            var oldCheckIn = record.CheckInTime;
            var oldCheckOut = record.CheckOutTime;

            // 1. Update basic fields
            record.CheckInTime = request.CheckInTime;
            record.CheckOutTime = request.CheckOutTime;
            record.Note = request.Note;
            record.Source = AttendanceSource.Manual; // Mark as manually corrected

            // 2. Recalculate Total Hours
            if (record.CheckInTime.HasValue && record.CheckOutTime.HasValue)
            {
                var duration = record.CheckOutTime.Value - record.CheckInTime.Value;
                record.TotalHours = Math.Max(0, duration.TotalHours);
            }
            else
            {
                record.TotalHours = 0;
            }

            // 3. Recalculate Status and Late Minutes
            int lateMinutes = 0;
            if (record.Shift != null && record.CheckInTime.HasValue)
            {
                var shiftStart = record.WorkDate.Date.Add(record.Shift.StartTime);
                var shiftEnd = record.WorkDate.Date.Add(record.Shift.EndTime);

                // Default status
                record.Status = AttendanceStatus.OnTime;

                // Check Late
                if (record.CheckInTime.Value > shiftStart)
                {
                    record.Status = AttendanceStatus.Late;
                    lateMinutes = (int)(record.CheckInTime.Value - shiftStart).TotalMinutes;
                }

                // Check Early Leave (if check-out exists)
                if (record.CheckOutTime.HasValue && record.CheckOutTime.Value < shiftEnd)
                {
                    record.Status = AttendanceStatus.EarlyLeave;
                }
            }

            _attendanceRecordRepository.Update(record);

            // 4. Sycn with AttendanceSummary
            var summary = await _attendanceSummaryRepository.Query()
                .FirstOrDefaultAsync(s => s.EmployeeId == record.EmployeeId && s.RecordDate.Date == record.WorkDate.Date, cancellationToken);
            
            if (summary != null)
            {
                summary.CheckinTime = record.CheckInTime;
                summary.CheckoutTime = record.CheckOutTime;
                summary.TotalHours = record.TotalHours;
                summary.LateMinutes = lateMinutes;
                summary.Status = record.Status;
                summary.UpdatedAt = DateTime.UtcNow;
                summary.Notes = record.Note;
                _attendanceSummaryRepository.Update(summary);
            }

            // 5. Audit Log
            var log = new SystemLog
            {
                Id = Guid.NewGuid(),
                UserId = request.CurrentUserId,
                ActionType = "UpdateAttendance",
                Description = $"Updated attendance {record.Id}. CheckIn: {oldCheckIn:HH:mm}->{record.CheckInTime:HH:mm}, CheckOut: {oldCheckOut:HH:mm}->{record.CheckOutTime:HH:mm}",
                LogLevel = "Warning",
                Timestamp = DateTime.UtcNow
            };
            await _systemLogRepository.AddAsync(log, cancellationToken);

            await _attendanceRecordRepository.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
