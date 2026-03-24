namespace Hrms.Domain.Enums
{
    /// <summary>
    /// Enum định nghĩa nguồn gốc của attendance record
    /// </summary>
    public enum AttendanceSource
    {
        /// <summary>
        /// Nhận diện khuôn mặt tự động (từ ESP32-CAM)
        /// </summary>
        FaceRecognition = 0,

        /// <summary>
        /// Nhập thủ công bởi Admin/HR
        /// </summary>
        Manual = 1,

        /// <summary>
        /// Import từ file Excel/CSV
        /// </summary>
        Import = 2,

        /// <summary>
        /// Từ mobile app
        /// </summary>
        MobileApp = 3
    }
}
