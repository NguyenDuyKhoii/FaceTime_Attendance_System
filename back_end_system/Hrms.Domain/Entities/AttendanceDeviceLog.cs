namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity lưu log từ thiết bị IoT (ESP32-CAM)
    /// Mỗi lần thiết bị capture ảnh và gửi về backend sẽ tạo một log
    /// </summary>
    public class AttendanceDeviceLog
    {
        public Guid Id { get; set; }

        /// <summary>
        /// ID thiết bị IoT
        /// </summary>
        public int? DeviceId { get; set; }
        public IoTDevice Device { get; set; } = null!;

        /// <summary>
        /// Thời điểm capture ảnh
        /// </summary>
        public DateTime CapturedAt { get; set; }

        /// <summary>
        /// Mã thiết bị (backward compatibility)
        /// </summary>
        public string DeviceCode { get; set; } = null!;

        /// <summary>
        /// Đường dẫn đến ảnh raw từ thiết bị
        /// </summary>
        public string? RawImagePath { get; set; }

        /// <summary>
        /// Face token/embedding từ AI service
        /// </summary>
        public string? FaceToken { get; set; }

        /// <summary>
        /// ID nhân viên được nhận diện (nếu có)
        /// </summary>
        public Guid? EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        /// <summary>
        /// Độ tin cậy của face recognition (0-1)
        /// </summary>
        public float? Confidence { get; set; }

        /// <summary>
        /// Kết quả xử lý: Success, Failed, Unknown
        /// </summary>
        public string? ProcessingResult { get; set; }

        /// <summary>
        /// Thông báo lỗi (nếu có)
        /// </summary>
        public string? ErrorMessage { get; set; }
    }
}
