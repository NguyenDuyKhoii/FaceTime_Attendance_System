namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity quản lý thông tin nhân viên
    /// </summary>
    public class Employee
    {
        public Guid Id { get; set; }

        /// <summary>
        /// Mã nhân viên (unique)
        /// </summary>
        public string EmployeeCode { get; set; } = null!;

        /// <summary>
        /// Họ và tên đầy đủ
        /// </summary>
        public string FullName { get; set; } = null!;

        /// <summary>
        /// Ngày sinh
        /// </summary>
        public DateTime DateOfBirth { get; set; }

        /// <summary>
        /// Số điện thoại
        /// </summary>
        public string? PhoneNumber { get; set; }

        /// <summary>
        /// Email
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// Số CMND/CCCD
        /// </summary>
        public string? IdentityNumber { get; set; }

        /// <summary>
        /// ID phòng ban
        /// </summary>
        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }

        /// <summary>
        /// Ngày vào làm
        /// </summary>
        public DateTime HireDate { get; set; }

        /// <summary>
        /// Nhân viên có đang active không
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Thời điểm tạo
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Thời điểm cập nhật cuối cùng
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        /// <summary>
        /// Danh sách ca làm việc được gán
        /// </summary>
        public ICollection<ShiftAssignment> ShiftAssignments { get; set; } = new List<ShiftAssignment>();

        /// <summary>
        /// Lịch sử chấm công
        /// </summary>
        public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();

        /// <summary>
        /// Tổng hợp attendance theo ngày
        /// </summary>
        public ICollection<AttendanceSummary> AttendanceSummaries { get; set; } = new List<AttendanceSummary>();

        /// <summary>
        /// Face template của nhân viên
        /// </summary>
        public FaceTemplate? FaceTemplate { get; set; }
    }
}