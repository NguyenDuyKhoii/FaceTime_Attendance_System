namespace Hrms.Application.DTOs.FaceRecognition
{
    /// <summary>
    /// DTO cho request nhận diện khuôn mặt từ ESP32-CAM
    /// </summary>
    public class FaceRecognitionRequestDto
    {
        /// <summary>
        /// Base64 encoded image từ ESP32-CAM
        /// </summary>
        public string ImageBase64 { get; set; } = null!;

        /// <summary>
        /// Device ID của ESP32-CAM
        /// </summary>
        public string DeviceId { get; set; } = null!;

        /// <summary>
        /// Timestamp khi capture ảnh
        /// </summary>
        public DateTime CapturedAt { get; set; } = DateTime.UtcNow;
    }
}
