using Hrms.Domain.Enums;

namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity tổng hợp attendance theo ngày cho mỗi nhân viên
    /// Dùng để báo cáo và tính toán payroll
    /// </summary>
    public class AttendanceSummary
    {
        public Guid Id { get; set; }
        
        /// <summary>
        /// ID nhân viên
        /// </summary>
        public Guid EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;
        
        /// <summary>
        /// Ngày làm việc
        /// </summary>
        public DateTime RecordDate { get; set; }
        
        /// <summary>
        /// ID ca làm việc được gán
        /// </summary>
        public Guid? ShiftId { get; set; }
        public Shift? Shift { get; set; }
        
        /// <summary>
        /// Thời gian check-in (CheckinTime trong ERD)
        /// </summary>
        public DateTime? CheckinTime { get; set; }
        
        /// <summary>
        /// Thời gian check-out (CheckoutTime trong ERD)
        /// </summary>
        public DateTime? CheckoutTime { get; set; }
        
        /// <summary>
        /// Tổng số giờ làm việc (tính cả break time)
        /// </summary>
        public double TotalHours { get; set; }
        
        /// <summary>
        /// Số phút đi muộn (LateMinutes trong ERD)
        /// </summary>
        public int LateMinutes { get; set; }
        
        /// <summary>
        /// Trạng thái attendance: OnTime, Late, EarlyLeave, Absent, etc. (Status trong ERD)
        /// </summary>
        public AttendanceStatus Status { get; set; }
        
        /// <summary>
        /// Ghi chú (Notes trong ERD)
        /// </summary>
        public string? Notes { get; set; }
        
        /// <summary>
        /// Thời điểm tạo bản ghi
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        /// <summary>
        /// Thời điểm cập nhật cuối cùng
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
    }
}
