namespace Hrms.Application.DTOs.Attendance
{
    /// <summary>
    /// DTO cho request face check-in từ ESP32-CAM
    /// </summary>
    public class FaceCheckInRequestDto
    {
        /// <summary>
        /// Device ID của ESP32-CAM
        /// </summary>
        public string DeviceId { get; set; } = string.Empty;

        /// <summary>
        /// Ảnh JPEG dạng base64 từ camera
        /// Format: "data:image/jpeg;base64,..."
        /// </summary>
        public string ImageBase64 { get; set; } = string.Empty;

        /// <summary>
        /// Thời điểm chụp ảnh
        /// </summary>
        public DateTime CapturedAt { get; set; }
    }
}
