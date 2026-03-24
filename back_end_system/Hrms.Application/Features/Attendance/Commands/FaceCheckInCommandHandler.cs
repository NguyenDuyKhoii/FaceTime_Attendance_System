using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.DTOs.Attendance;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Domain.Enums;

namespace Hrms.Application.Features.Attendance.Commands
{
    /// <summary>
    /// Handler xử lý face check-in từ ESP32-CAM
    /// </summary>
    public class FaceCheckInCommandHandler : IRequestHandler<FaceCheckInCommand, FaceCheckInResponseDto>
    {
        private readonly IPythonAIService _pythonAIService;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IAttendanceRecordRepository _attendanceRecordRepository;
        private readonly IAttendanceDeviceLogRepository _deviceLogRepository;
        private readonly IIoTDeviceRepository _iotDeviceRepository;
        private readonly IShiftAssignmentRepository _shiftAssignmentRepository;
        private readonly ILogger<FaceCheckInCommandHandler> _logger;

        public FaceCheckInCommandHandler(
            IPythonAIService pythonAIService,
            IEmployeeRepository employeeRepository,
            IAttendanceRecordRepository attendanceRecordRepository,
            IAttendanceDeviceLogRepository deviceLogRepository,
            IIoTDeviceRepository iotDeviceRepository,
            IShiftAssignmentRepository shiftAssignmentRepository,
            IAttendanceHubService attendanceHubService,
            ILogger<FaceCheckInCommandHandler> logger)
        {
            _pythonAIService = pythonAIService;
            _employeeRepository = employeeRepository;
            _attendanceRecordRepository = attendanceRecordRepository;
            _deviceLogRepository = deviceLogRepository;
            _iotDeviceRepository = iotDeviceRepository;
            _shiftAssignmentRepository = shiftAssignmentRepository;
            _attendanceHubService = attendanceHubService;
            _logger = logger;
        }

        private readonly IAttendanceHubService _attendanceHubService;

        public async Task<FaceCheckInResponseDto> Handle(FaceCheckInCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Processing face check-in from device: {DeviceId}", request.DeviceId);
            _logger.LogInformation("ImageBase64 length received: {Length}", request.ImageBase64?.Length ?? 0);

            // 1. Validate device exists
            IoTDevice? device = null;
            if (int.TryParse(request.DeviceId, out var deviceIdInt))
            {
                device = await _iotDeviceRepository.GetByIdWithProductionLineAsync(deviceIdInt, cancellationToken);
            }
            else
            {
                // Nếu là string như "esp32cam-01", tìm bằng DeviceName thay vì ID số.
                var allDevices = await _iotDeviceRepository.GetAllAsync(cancellationToken);
                device = allDevices.FirstOrDefault(d => 
                    string.Equals(d.DeviceName, request.DeviceId, StringComparison.OrdinalIgnoreCase));
                    
                if (device != null)
                {
                    // Nạp luôn ProductionLine nếu tìm thấy bằng Name
                    device = await _iotDeviceRepository.GetByIdWithProductionLineAsync(device.Id, cancellationToken);
                    _logger.LogInformation("Found device by Name: {DeviceName}, ID: {Id}", device?.DeviceName, device?.Id);
                }
            }
            
            // 2. Gọi Python AI Service để nhận diện khuôn mặt
            _logger.LogInformation("Attempting to call Python AI Service for device: {DeviceId}", request.DeviceId);
            var recognizeResult = await _pythonAIService.RecognizeFaceAsync(
                request.DeviceId, 
                request.ImageBase64, 
                cancellationToken);

            // 3. Tạo device log
            var deviceLog = new AttendanceDeviceLog
            {
                Id = Guid.NewGuid(),
                DeviceId = device?.Id,
                DeviceCode = request.DeviceId,
                CapturedAt = request.CapturedAt,
                ProcessingResult = "Processing"
            };

            try
            {
                // 4. Kiểm tra lỗi hệ thống từ AI
                if (!recognizeResult.Ok)
                {
                    deviceLog.ProcessingResult = "Failed";
                    deviceLog.ErrorMessage = recognizeResult.Reason ?? "Python AI Service error";
                    await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
                    await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                    _logger.LogWarning("Python AI recognition failed: {Reason}", recognizeResult.Reason);

                    return new FaceCheckInResponseDto
                    {
                        Success = false,
                        Message = "Lỗi dịch vụ nhận diện khuôn mặt",
                        Status = "Failed"
                    };
                }

                // 5. Kiểm tra quyết định nhận diện (accept/reject)
                if (recognizeResult.Decision != "accept")
                {
                    deviceLog.ProcessingResult = "Rejected";
                    deviceLog.ErrorMessage = recognizeResult.Reason ?? "Face not recognized";
                    await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
                    await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation("Face not recognized. Reason: {Reason}", recognizeResult.Reason);

                    string friendlyMessage = "Không nhận diện được khuôn mặt";
                    if (recognizeResult.Reason == "REQUIRE_EXACTLY_ONE_FACE")
                    {
                        friendlyMessage = recognizeResult.FaceCount == 0 
                            ? "Không tìm thấy khuôn mặt trong ảnh" 
                            : "Phát hiện quá nhiều khuôn mặt, hãy thử lại";
                    }
                    else if (recognizeResult.Reason == "LOW_CONFIDENCE")
                    {
                        friendlyMessage = "Khuôn mặt lạ hoặc chưa được đăng ký";
                    }
                    else if (recognizeResult.Reason == "EMPTY_GALLERY")
                    {
                        friendlyMessage = "Hệ thống chưa có dữ liệu mẫu khuôn mặt";
                    }

                    return new FaceCheckInResponseDto
                    {
                        Success = false,
                        Message = friendlyMessage,
                        Status = "UnknownFace",
                        Confidence = recognizeResult.Confidence
                    };
                }

                // 6. Tìm Employee bằng PersonId (EmployeeCode)
                if (string.IsNullOrEmpty(recognizeResult.PersonId))
                {
                    deviceLog.ProcessingResult = "Failed";
                    deviceLog.ErrorMessage = "PersonId is null from Python AI";
                    await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
                    await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                    return new FaceCheckInResponseDto
                    {
                        Success = false,
                        Message = "Lỗi dữ liệu từ AI Service",
                        Status = "Failed"
                    };
                }

                var employee = await _employeeRepository.GetByEmployeeCodeAsync(recognizeResult.PersonId, cancellationToken);
                
                if (employee == null)
                {
                    deviceLog.ProcessingResult = "Failed";
                    deviceLog.ErrorMessage = $"Employee not found with code: {recognizeResult.PersonId}";
                    await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
                    await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                    _logger.LogWarning("Employee not found with code: {EmployeeCode}", recognizeResult.PersonId);

                    return new FaceCheckInResponseDto
                    {
                        Success = false,
                        Message = $"Không tìm thấy nhân viên: {recognizeResult.Name}",
                        Status = "Failed",
                        Confidence = recognizeResult.Confidence
                    };
                }

                deviceLog.EmployeeId = employee.Id;
                deviceLog.Confidence = recognizeResult.Confidence;

                // 7. Kiểm tra ca làm việc hôm nay
                // Chuyển đổi CapturedAt từ UTC sang múi giờ Việt Nam (UTC+7)
                var tzInfo = TimeZoneInfo.FindSystemTimeZoneById(
                    Environment.OSVersion.Platform == PlatformID.Win32NT ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");
                var now = TimeZoneInfo.ConvertTimeFromUtc(request.CapturedAt, tzInfo);
                var today = now.Date;

                // Lấy ShiftAssignment để kiểm tra Location (ProductionLine) + Shift info
                var shiftAssignment = await _shiftAssignmentRepository.GetCurrentShiftAssignmentAsync(
                    employee.Id, today, cancellationToken);

                // --- LOGIC KIỂM TRA NGHIÊM NGẶT ---
                
                // A. Kiểm tra có ca làm việc hôm nay không
                if (shiftAssignment == null)
                {
                    deviceLog.ProcessingResult = "NoShiftToday";
                    deviceLog.ErrorMessage = $"No shift assigned for today: {today:yyyy-MM-dd}";
                    await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
                    await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                    _logger.LogWarning("Employee {EmployeeCode} has no shift assigned for today", employee.EmployeeCode);

                    return new FaceCheckInResponseDto
                    {
                        Success = false,
                        Message = "Bạn không có ca làm việc được phân công hôm nay.",
                        Status = "NoShiftToday",
                        Confidence = recognizeResult.Confidence
                    };
                }

                // B. Kiểm tra địa điểm (Dây chuyền)
                // Phải đúng ProductionLine đã gán
                if (device == null || device.LineId != shiftAssignment.ProductionLineId)
                {
                    deviceLog.ProcessingResult = "WrongLocation";
                    deviceLog.ErrorMessage = $"Wrong Location. Assigned: {shiftAssignment.ProductionLine?.LineName ?? "Line " + shiftAssignment.ProductionLineId}, Device at: {device?.ProductionLine?.LineName ?? "Unknown"}";
                    await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
                    await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                    _logger.LogWarning("Employee {EmployeeCode} check-in at wrong location. Assigned: {Assigned}, Device: {DeviceLine}",
                        employee.EmployeeCode, shiftAssignment.ProductionLine?.LineName, device?.ProductionLine?.LineName);

                    return new FaceCheckInResponseDto
                    {
                        Success = false,
                        Message = $"Sai địa điểm! Bạn được phân công tại: {shiftAssignment.ProductionLine?.LineName ?? "Dây chuyền assigned"}",
                        Status = "WrongLocation",
                        Confidence = recognizeResult.Confidence
                    };
                }

                // C. Kiểm tra khung giờ ca làm việc (Cho phép 2h trước Start và 1h sau End)
                if (shiftAssignment.Shift != null)
                {
                    var shiftStart = today.Add(shiftAssignment.Shift.StartTime);
                    var shiftEnd = today.Add(shiftAssignment.Shift.EndTime);
                    
                    // Nếu ca làm kéo dài qua đêm (ví dụ 22h - 06h sáng hôm sau) - Giả định đơn giản ca trong ngày
                    var validStart = shiftStart.AddHours(-2);
                    var validEnd = shiftEnd.AddHours(1);

                    if (now < validStart || now > validEnd)
                    {
                        deviceLog.ProcessingResult = "WrongShiftTime";
                        deviceLog.ErrorMessage = $"Outside shift window. Shift: {shiftAssignment.Shift.StartTime}-{shiftAssignment.Shift.EndTime}, Captured: {now:HH:mm}";
                        await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
                        await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                        _logger.LogWarning("Employee {EmployeeCode} check-in at wrong time. Shift: {Start}-{End}, Current: {Now}",
                            employee.EmployeeCode, shiftAssignment.Shift.StartTime, shiftAssignment.Shift.EndTime, now);

                        return new FaceCheckInResponseDto
                        {
                            Success = false,
                            Message = $"Sai khung giờ! Ca của bạn: {shiftAssignment.Shift.StartTime:hh\\:mm} - {shiftAssignment.Shift.EndTime:hh\\:mm}",
                            Status = "WrongShiftTime",
                            Confidence = recognizeResult.Confidence
                        };
                    }
                }
                // -------------------------------

                var existingRecord = await _attendanceRecordRepository.GetByEmployeeAndDateAsync(employee.Id, today, cancellationToken);

                if (existingRecord != null)
                {
                    // Đã check-in rồi, xử lý check-out
                    if (existingRecord.CheckOutTime.HasValue)
                    {
                        // Đã check-out rồi
                        deviceLog.ProcessingResult = "AlreadyCheckedOut";
                        await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
                        await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                        var prevCheckOutLocal = TimeZoneInfo.ConvertTimeFromUtc(existingRecord.CheckOutTime.Value, tzInfo);
                        return new FaceCheckInResponseDto
                        {
                            Success = false,
                            Message = $"Bạn đã check-out lúc {prevCheckOutLocal:HH:mm}",
                            EmployeeName = employee.FullName,
                            Status = "AlreadyCheckedOut",
                            Confidence = recognizeResult.Confidence
                        };
                    }
                    else
                    {
                        // Chưa check-out, thực hiện check-out
                        existingRecord.CheckOutTime = request.CapturedAt;
                        
                        // Tính total hours
                        if (existingRecord.CheckInTime.HasValue)
                        {
                            var totalMinutes = (existingRecord.CheckOutTime.Value - existingRecord.CheckInTime.Value).TotalMinutes;
                            existingRecord.TotalHours = totalMinutes / 60.0;
                        }

                        // Kiểm tra early leave nếu có shift (đã lấy ở trên)
                        if (shiftAssignment?.Shift != null)
                        {
                            var expectedEndTime = today.Add(shiftAssignment.Shift.EndTime);
                            if (existingRecord.CheckOutTime.Value < expectedEndTime)
                            {
                                // Về sớm
                                existingRecord.Status = AttendanceStatus.EarlyLeave;
                            }
                        }

                        _attendanceRecordRepository.Update(existingRecord);
                        await _attendanceRecordRepository.SaveChangesAsync(cancellationToken);

                        // Phát sự kiện real-time
                        await _attendanceHubService.NotifyAttendanceUpdatedAsync();

                        deviceLog.ProcessingResult = "CheckedOut";
                        await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
                        await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                        _logger.LogInformation("Employee {EmployeeCode} checked out at {Time}", 
                            employee.EmployeeCode, existingRecord.CheckOutTime);

                        return new FaceCheckInResponseDto
                        {
                            Success = true,
                            Message = $"Check-out thành công lúc {now:HH:mm}",
                            EmployeeName = employee.FullName,
                            CheckInTime = existingRecord.CheckOutTime,
                            Status = "CheckedOut",
                            Confidence = recognizeResult.Confidence
                        };
                    }
                }

                // 8. Chưa check-in, tạo attendance record mới
                // (shiftAssignment đã lấy ở trên)

                var newRecord = new AttendanceRecord
                {
                    Id = Guid.NewGuid(),
                    EmployeeId = employee.Id,
                    WorkDate = today,
                    CheckInTime = request.CapturedAt,
                    ShiftId = shiftAssignment?.ShiftId,
                    Status = AttendanceStatus.OnTime,
                    Source = Hrms.Domain.Enums.AttendanceSource.FaceRecognition
                };

                // Tính late minutes và set status nếu có shift
                if (shiftAssignment?.Shift != null)
                {
                    var expectedStartTime = today.Add(shiftAssignment.Shift.StartTime);
                    if (newRecord.CheckInTime > expectedStartTime)
                    {
                        // Đi muộn
                        newRecord.Status = AttendanceStatus.Late;
                    }
                }

                await _attendanceRecordRepository.AddAsync(newRecord, cancellationToken);
                await _attendanceRecordRepository.SaveChangesAsync(cancellationToken);

                // Phát sự kiện real-time
                await _attendanceHubService.NotifyAttendanceUpdatedAsync();

                deviceLog.ProcessingResult = "CheckedIn";
                await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
                await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Employee {EmployeeCode} checked in at {Time}", 
                    employee.EmployeeCode, newRecord.CheckInTime);

                return new FaceCheckInResponseDto
                {
                    Success = true,
                    Message = $"Check-in thành công lúc {now:HH:mm}",
                    EmployeeName = employee.FullName,
                    CheckInTime = newRecord.CheckInTime,
                    Status = "CheckedIn",
                    Confidence = recognizeResult.Confidence
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing face check-in for device: {DeviceId}", request.DeviceId);

                deviceLog.ProcessingResult = "Error";
                deviceLog.ErrorMessage = ex.Message;
                await _deviceLogRepository.AddAsync(deviceLog, cancellationToken);
                await _deviceLogRepository.SaveChangesAsync(cancellationToken);

                return new FaceCheckInResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xử lý check-in",
                    Status = "Error"
                };
            }
        }
    }
}
