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
    /// Handler xử lý check-in
    /// 1. Kiểm tra employee tồn tại và active
    /// 2. Tìm shift hiện tại của employee
    /// 3. Kiểm tra đã check-in chưa (tránh duplicate)
    /// 4. Tính toán Late minutes
    /// 5. Tạo AttendanceRecord
    /// 6. Cập nhật AttendanceSummary
    /// </summary>
    public class CheckInCommandHandler : IRequestHandler<CheckInCommand, CheckInResponseDto>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IShiftAssignmentRepository _shiftAssignmentRepository;
        private readonly IAttendanceRecordRepository _attendanceRecordRepository;
        private readonly IAttendanceSummaryRepository _attendanceSummaryRepository;
        private readonly IIoTDeviceRepository _iotDeviceRepository;
        private readonly ISystemLogRepository _systemLogRepository;
        private readonly ILogger<CheckInCommandHandler> _logger;

        public CheckInCommandHandler(
            IEmployeeRepository employeeRepository,
            IShiftAssignmentRepository shiftAssignmentRepository,
            IAttendanceRecordRepository attendanceRecordRepository,
            IAttendanceSummaryRepository attendanceSummaryRepository,
            IIoTDeviceRepository iotDeviceRepository,
            ISystemLogRepository systemLogRepository,
            ILogger<CheckInCommandHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _shiftAssignmentRepository = shiftAssignmentRepository;
            _attendanceRecordRepository = attendanceRecordRepository;
            _attendanceSummaryRepository = attendanceSummaryRepository;
            _iotDeviceRepository = iotDeviceRepository;
            _systemLogRepository = systemLogRepository;
            _logger = logger;
        }

        public async Task<CheckInResponseDto> Handle(CheckInCommand request, CancellationToken cancellationToken)
        {
            var checkInTime = request.CheckInTime ?? DateTime.UtcNow;
            var workDate = checkInTime.Date;

            // 1. Kiểm tra employee tồn tại
            var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId, cancellationToken);

            if (employee == null || !employee.IsActive)
            {
                throw new KeyNotFoundException($"Employee với ID {request.EmployeeId} không tồn tại hoặc không active");
            }

            // 2. Tìm shift hiện tại của employee
            var currentShiftAssignment = await _shiftAssignmentRepository.GetCurrentShiftAssignmentAsync(
                request.EmployeeId, workDate, cancellationToken);

            if (currentShiftAssignment == null)
            {
                return new CheckInResponseDto
                {
                    Success = false,
                    Message = "Nhân viên chưa được gán ca làm việc",
                    CheckInTime = checkInTime
                };
            }

            // 2.1 Kiểm tra Vị trí (Location Verification)
            if (currentShiftAssignment.ProductionLineId.HasValue)
            {
                IoTDevice? device = null;
                if (int.TryParse(request.DeviceId, out var deviceIdInt))
                {
                    device = await _iotDeviceRepository.GetByIdWithProductionLineAsync(deviceIdInt, cancellationToken);
                }

                if (device != null && device.LineId != currentShiftAssignment.ProductionLineId)
                {
                    _logger.LogWarning("Wrong Location check-in: Employee {EmployeeCode} assigned to {AssignedLine}, but checking in at {DeviceLine}",
                        employee.EmployeeCode, currentShiftAssignment.ProductionLine?.LineName, device.ProductionLine?.LineName ?? "Unknown");

                    return new CheckInResponseDto
                    {
                        Success = false,
                        Message = $"Sai địa điểm! Bạn được phân công tại: {currentShiftAssignment.ProductionLine?.LineName ?? "Dây chuyền " + currentShiftAssignment.ProductionLineId}. " +
                                  $"Máy quét này thuộc: {device.ProductionLine?.LineName ?? "Dây chuyền khác"}",
                        CheckInTime = checkInTime,
                        Status = "WrongLocation"
                    };
                }
            }

            var shift = currentShiftAssignment.Shift;
            var shiftId = shift.Id;

            // 3. Kiểm tra đã check-in chưa (tránh duplicate)
            var existingRecord = await _attendanceRecordRepository.GetByEmployeeAndDateAsync(
                request.EmployeeId, workDate, cancellationToken);

            if (existingRecord != null)
            {
                return new CheckInResponseDto
                {
                    Success = false,
                    Message = "Bạn đã check-in rồi",
                    CheckInTime = existingRecord.CheckInTime,
                    AttendanceRecordId = existingRecord.Id
                };
            }

            // 4. Tính toán Late minutes
            var shiftStartTime = workDate.Add(shift.StartTime);
            var lateMinutes = 0;
            AttendanceStatus status = AttendanceStatus.OnTime;

            if (checkInTime > shiftStartTime)
            {
                lateMinutes = (int)(checkInTime - shiftStartTime).TotalMinutes;
                if (lateMinutes > shift.AllowedLateMinutes)
                {
                    status = AttendanceStatus.Late;
                }
            }

            // 5. Tìm hoặc tạo AttendanceRecord
            var attendanceRecord = await _attendanceRecordRepository.GetByEmployeeAndDateAsync(
                request.EmployeeId, workDate, cancellationToken);

            if (attendanceRecord == null)
            {
                attendanceRecord = new AttendanceRecord
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = request.EmployeeId,
                    ShiftId = shift.Id,
                    WorkDate = workDate,
                    CheckInTime = checkInTime,
                    Status = status,
                    Source = AttendanceSource.FaceRecognition,
                    CreatedAt = DateTime.UtcNow
                };

                await _attendanceRecordRepository.AddAsync(attendanceRecord, cancellationToken);
            }
            else
            {
                attendanceRecord.CheckInTime = checkInTime;
                attendanceRecord.Status = status;
                attendanceRecord.ShiftId = shift.Id;
                _attendanceRecordRepository.Update(attendanceRecord);
            }

            await _attendanceRecordRepository.SaveChangesAsync(cancellationToken);

            // 6. Cập nhật AttendanceSummary
            await UpdateAttendanceSummary(request.EmployeeId, workDate, shift.Id, cancellationToken);

            // 7. Tạo system log
            var systemLog = new SystemLog
            {
                Id = Guid.NewGuid(),
                UserId = null, // System action
                ActionType = "CheckIn",
                Description = $"Employee {employee.EmployeeCode} checked in at {checkInTime:yyyy-MM-dd HH:mm:ss}",
                EntityType = "AttendanceRecord",
                EntityId = attendanceRecord.Id,
                LogLevel = "Info",
                Timestamp = DateTime.UtcNow
            };
            await _systemLogRepository.AddAsync(systemLog, cancellationToken);
            await _systemLogRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Check-in successful: Employee {EmployeeCode} at {CheckInTime}", 
                employee.EmployeeCode, checkInTime);

            return new CheckInResponseDto
            {
                Success = true,
                Message = status == AttendanceStatus.Late 
                    ? $"Check-in thành công (Muộn {lateMinutes} phút)" 
                    : "Check-in thành công",
                CheckInTime = checkInTime,
                Status = status.ToString(),
                LateMinutes = lateMinutes > 0 ? lateMinutes : null,
                AttendanceRecordId = attendanceRecord.Id
            };
        }

        /// <summary>
        /// Cập nhật hoặc tạo AttendanceSummary
        /// </summary>
        private async Task UpdateAttendanceSummary(Guid employeeId, DateTime workDate, Guid shiftId, CancellationToken cancellationToken)
        {
            var summary = await _attendanceSummaryRepository.GetByEmployeeAndDateAsync(employeeId, workDate, cancellationToken);

            var record = await _attendanceRecordRepository.GetByEmployeeAndDateAsync(employeeId, workDate, cancellationToken);
            if (record == null) return;

            // Lấy record với Shift để tính toán
            var recordWithShift = await _attendanceRecordRepository.GetByIdWithShiftAsync(record.Id, cancellationToken);
            if (recordWithShift == null) return;

            if (summary == null)
            {
                summary = new AttendanceSummary
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = employeeId,
                    RecordDate = workDate,
                    ShiftId = shiftId,
                    CreatedAt = DateTime.UtcNow
                };
                await _attendanceSummaryRepository.AddAsync(summary, cancellationToken);
            }

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

            _attendanceSummaryRepository.Update(summary);
            await _attendanceSummaryRepository.SaveChangesAsync(cancellationToken);
        }
    }
}
