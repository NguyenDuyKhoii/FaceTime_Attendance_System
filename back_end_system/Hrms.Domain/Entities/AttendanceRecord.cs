using Hrms.Domain.Enums;

namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity lưu chi tiết từng lần check-in/check-out của nhân viên
    /// </summary>
    public class AttendanceRecord
    {
        public Guid Id { get; set; }

        /// <summary>
        /// ID nhân viên
        /// </summary>
        public Guid EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;

        /// <summary>
        /// ID ca làm việc
        /// </summary>
        public Guid? ShiftId { get; set; }
        public Shift? Shift { get; set; }

        /// <summary>
        /// Ngày làm việc
        /// </summary>
        public DateTime WorkDate { get; set; }

        /// <summary>
        /// Thời gian check-in
        /// </summary>
        public DateTime? CheckInTime { get; set; }

        /// <summary>
        /// Thời gian check-out
        /// </summary>
        public DateTime? CheckOutTime { get; set; }

        /// <summary>
        /// Tổng số giờ làm việc
        /// </summary>
        public double TotalHours { get; set; }

        /// <summary>
        /// Trạng thái: OnTime, Late, EarlyLeave, Absent, etc.
        /// </summary>
        public AttendanceStatus Status { get; set; }

        /// <summary>
        /// Nguồn: FaceRecognition, Manual, Import
        /// </summary>
        public AttendanceSource Source { get; set; }

        /// <summary>
        /// Ghi chú (Note trong ERD)
        /// </summary>
        public string? Note { get; set; }

        /// <summary>
        /// Thời điểm tạo bản ghi
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}