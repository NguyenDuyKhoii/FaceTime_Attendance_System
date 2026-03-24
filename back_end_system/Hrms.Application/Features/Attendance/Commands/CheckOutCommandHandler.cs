using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.DTOs.Attendance;
using Hrms.Application.Features.Attendance.Commands;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Domain.Enums;

namespace Hrms.Application.Features.Attendance.Commands
{
    /// <summary>
    /// Handler xử lý check-out
    /// 1. Kiểm tra employee tồn tại
    /// 2. Tìm AttendanceRecord của ngày hôm nay
    /// 3. Kiểm tra đã check-in chưa
    /// 4. Tính toán TotalHours
    /// 5. Cập nhật AttendanceRecord
    /// 6. Cập nhật AttendanceSummary
    /// </summary>
    public class CheckOutCommandHandler : IRequestHandler<CheckOutCommand, CheckInResponseDto>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IAttendanceRecordRepository _attendanceRecordRepository;
        private readonly IAttendanceSummaryRepository _attendanceSummaryRepository;
        private readonly ISystemLogRepository _systemLogRepository;
        private readonly ILogger<CheckOutCommandHandler> _logger;

        public CheckOutCommandHandler(
            IEmployeeRepository employeeRepository,
            IAttendanceRecordRepository attendanceRecordRepository,
            IAttendanceSummaryRepository attendanceSummaryRepository,
            ISystemLogRepository systemLogRepository,
            ILogger<CheckOutCommandHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _attendanceRecordRepository = attendanceRecordRepository;
            _attendanceSummaryRepository = attendanceSummaryRepository;
            _systemLogRepository = systemLogRepository;
            _logger = logger;
        }

        public async Task<CheckInResponseDto> Handle(CheckOutCommand request, CancellationToken cancellationToken)
        {
            var checkOutTime = request.CheckOutTime ?? DateTime.UtcNow;
            var workDate = checkOutTime.Date;

            // 1. Kiểm tra employee tồn tại
            var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId, cancellationToken);

            if (employee == null || !employee.IsActive)
            {
                throw new KeyNotFoundException($"Employee với ID {request.EmployeeId} không tồn tại hoặc không active");
            }

            // 2. Tìm AttendanceRecord của ngày hôm nay
            var recordTemp = await _attendanceRecordRepository.GetByEmployeeAndDateAsync(request.EmployeeId, workDate, cancellationToken);
            if (recordTemp == null)
            {
                return new CheckInResponseDto
                {
                    Success = false,
                    Message = "Bạn chưa check-in hôm nay",
                    CheckOutTime = checkOutTime
                };
            }

            var attendanceRecord = await _attendanceRecordRepository.GetByIdWithShiftAsync(recordTemp.Id, cancellationToken);

            if (attendanceRecord == null || !attendanceRecord.CheckInTime.HasValue)
            {
                return new CheckInResponseDto
                {
                    Success = false,
                    Message = "Bạn chưa check-in hôm nay",
                    CheckOutTime = checkOutTime
                };
            }

            if (attendanceRecord.CheckOutTime.HasValue)
            {
                return new CheckInResponseDto
                {
                    Success = false,
                    Message = "Bạn đã check-out rồi",
                    CheckOutTime = attendanceRecord.CheckOutTime,
                    AttendanceRecordId = attendanceRecord.Id
                };
            }

            // 3. Tính toán TotalHours và EarlyLeaveMinutes
            var checkInTime = attendanceRecord.CheckInTime.Value;
            var totalHours = (checkOutTime - checkInTime).TotalHours;

            // Trừ break time nếu có
            if (attendanceRecord.Shift?.BreakDuration.HasValue == true)
            {
                totalHours -= attendanceRecord.Shift.BreakDuration.Value.TotalHours;
            }

            attendanceRecord.CheckOutTime = checkOutTime;
            attendanceRecord.TotalHours = Math.Max(0, totalHours);

            // Tính EarlyLeaveMinutes
            int earlyLeaveMinutes = 0;
            if (attendanceRecord.Shift != null)
            {
                var shiftEndTime = workDate.Add(attendanceRecord.Shift.EndTime);
                if (checkOutTime < shiftEndTime)
                {
                    earlyLeaveMinutes = (int)(shiftEndTime - checkOutTime).TotalMinutes;
                    if (earlyLeaveMinutes > attendanceRecord.Shift.AllowedEarlyLeaveMinutes)
                    {
                        attendanceRecord.Status = AttendanceStatus.EarlyLeave;
                    }
                }
            }

            // Cập nhật status nếu cần
            if (attendanceRecord.Status == AttendanceStatus.OnTime && earlyLeaveMinutes > 0)
            {
                // Giữ nguyên status nếu đã là Late
            }

            _attendanceRecordRepository.Update(attendanceRecord);
            await _attendanceRecordRepository.SaveChangesAsync(cancellationToken);

            // 4. Cập nhật AttendanceSummary
            await UpdateAttendanceSummary(request.EmployeeId, workDate, cancellationToken);

            // 5. Tạo system log
            var systemLog = new SystemLog
            {
                Id = Guid.NewGuid(),
                UserId = null,
                ActionType = "CheckOut",
                Description = $"Employee {employee.EmployeeCode} checked out at {checkOutTime:yyyy-MM-dd HH:mm:ss}",
                EntityType = "AttendanceRecord",
                EntityId = attendanceRecord.Id,
                LogLevel = "Info",
                Timestamp = DateTime.UtcNow
            };
            await _systemLogRepository.AddAsync(systemLog, cancellationToken);
            await _systemLogRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Check-out successful: Employee {EmployeeCode} at {CheckOutTime}, TotalHours: {TotalHours}", 
                employee.EmployeeCode, checkOutTime, totalHours);

            return new CheckInResponseDto
            {
                Success = true,
                Message = $"Check-out thành công. Tổng giờ làm: {totalHours:F2} giờ",
                CheckInTime = checkInTime,
                CheckOutTime = checkOutTime,
                Status = attendanceRecord.Status.ToString(),
                AttendanceRecordId = attendanceRecord.Id
            };
        }

        /// <summary>
        /// Cập nhật AttendanceSummary sau khi check-out
        /// </summary>
        private async Task UpdateAttendanceSummary(Guid employeeId, DateTime workDate, CancellationToken cancellationToken)
        {
            var summary = await _attendanceSummaryRepository.GetByEmployeeAndDateAsync(employeeId, workDate, cancellationToken);

            var record = await _attendanceRecordRepository.GetByEmployeeAndDateAsync(employeeId, workDate, cancellationToken);
            if (record == null) return;

            var recordWithShift = await _attendanceRecordRepository.GetByIdWithShiftAsync(record.Id, cancellationToken);
            if (recordWithShift == null || summary == null) return;

            summary.CheckinTime = recordWithShift.CheckInTime;
            summary.CheckoutTime = recordWithShift.CheckOutTime;
            summary.TotalHours = recordWithShift.TotalHours;
            summary.Status = recordWithShift.Status;
            summary.UpdatedAt = DateTime.UtcNow;

            // Tính LateMinutes
            if (recordWithShift.CheckInTime.HasValue && recordWithShift.Shift != null)
            {
                var shiftStartTime = workDate.Add(recordWithShift.Shift.StartTime);
                if (recordWithShift.CheckInTime > shiftStartTime)
                {
                    summary.LateMinutes = (int)(recordWithShift.CheckInTime.Value - shiftStartTime).TotalMinutes;
                }
            }

            // Theo ERD: AttendanceSummary không có EarlyLeaveMinutes

            _attendanceSummaryRepository.Update(summary);
            await _attendanceSummaryRepository.SaveChangesAsync(cancellationToken);
        }
    }
}
