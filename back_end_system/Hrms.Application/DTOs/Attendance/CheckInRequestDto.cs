namespace Hrms.Application.DTOs.Attendance
{
    /// <summary>
    /// DTO cho request check-in
    /// </summary>
    public class CheckInRequestDto
    {
        /// <summary>
        /// ID nhân viên (từ face recognition)
        /// </summary>
        public Guid EmployeeId { get; set; }

        /// <summary>
        /// ID thiết bị IoT (ESP32-CAM)
        /// </summary>
        public string? DeviceId { get; set; }

        /// <summary>
        /// Thời gian check-in (nếu không có thì dùng thời gian hiện tại)
        /// </summary>
        public DateTime? CheckInTime { get; set; }
    }
}
