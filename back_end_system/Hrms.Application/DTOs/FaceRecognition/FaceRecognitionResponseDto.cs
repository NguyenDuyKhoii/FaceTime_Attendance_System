namespace Hrms.Application.DTOs.FaceRecognition
{
    /// <summary>
    /// DTO cho response nhận diện khuôn mặt
    /// </summary>
    public class FaceRecognitionResponseDto
    {
        /// <summary>
        /// ID nhân viên được nhận diện (null nếu không nhận diện được)
        /// </summary>
        public Guid? EmployeeId { get; set; }

        /// <summary>
        /// Mã nhân viên
        /// </summary>
        public string? EmployeeCode { get; set; }

        /// <summary>
        /// Tên nhân viên
        /// </summary>
        public string? EmployeeName { get; set; }

        /// <summary>
        /// Độ tin cậy (confidence score) từ 0-1
        /// </summary>
        public float ConfidenceScore { get; set; }

        /// <summary>
        /// Trạng thái: Success, Failed, Unknown
        /// </summary>
        public string Status { get; set; } = null!;

        /// <summary>
        /// Thông báo
        /// </summary>
        public string Message { get; set; } = null!;

        /// <summary>
        /// ID của device log
        /// </summary>
        public Guid? DeviceLogId { get; set; }
    }
}
