namespace Hrms.Application.DTOs.Attendance
{
    /// <summary>
    /// DTO cho response face check-in trả về ESP32-CAM
    /// </summary>
    public class FaceCheckInResponseDto
    {
        /// <summary>
        /// Trạng thái thành công hay thất bại
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Thông báo cho user
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Tên nhân viên (nếu nhận diện thành công)
        /// </summary>
        public string? EmployeeName { get; set; }

        /// <summary>
        /// Thời gian check-in (nếu thành công)
        /// </summary>
        public DateTime? CheckInTime { get; set; }

        /// <summary>
        /// Trạng thái chi tiết: "CheckedIn", "AlreadyCheckedIn", "CheckedOut", "Failed", "UnknownFace", "NoShiftToday", "WrongShiftTime", "WrongLocation"
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Confidence score từ AI (0-1 hoặc 0-100)
        /// </summary>
        public float? Confidence { get; set; }
    }
}
