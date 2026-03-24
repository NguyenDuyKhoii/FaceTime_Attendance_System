using MediatR;
using Hrms.Application.DTOs.Attendance;

namespace Hrms.Application.Features.Attendance.Commands
{
    /// <summary>
    /// Command xử lý face check-in từ ESP32-CAM
    /// Flow:
    /// 1. Nhận ảnh từ ESP32-CAM
    /// 2. Gọi Python AI Service để nhận diện
    /// 3. Tìm Employee trong database
    /// 4. Kiểm tra đã check-in chưa
    /// 5. Tạo AttendanceRecord hoặc update check-out
    /// 6. Lưu device log
    /// </summary>
    public class FaceCheckInCommand : IRequest<FaceCheckInResponseDto>
    {
        public string DeviceId { get; set; } = string.Empty;
        public string ImageBase64 { get; set; } = string.Empty;
        public DateTime CapturedAt { get; set; }
    }
}
