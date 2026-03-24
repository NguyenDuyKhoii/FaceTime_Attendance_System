namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity quản lý tài khoản người dùng hệ thống
    /// Theo ERD: UserId (PK), Username, PasswordHash, RoleId (FK), LastLogin, LoginAttempts, IsLocked, CreatedAt
    /// </summary>
    public class UserAccount
    {
        public Guid Id { get; set; }

        /// <summary>
        /// Tên đăng nhập (unique)
        /// </summary>
        public string Username { get; set; } = null!;

        /// <summary>
        /// Mật khẩu đã hash (BCrypt/SHA256)
        /// </summary>
        public string PasswordHash { get; set; } = null!;

        /// <summary>
        /// ID role (FK to Role) - Theo ERD: Users có RoleId (one-to-many với Role)
        /// </summary>
        public int RoleId { get; set; }
        public Role Role { get; set; } = null!;

        /// <summary>
        /// Thời điểm đăng nhập cuối cùng (LastLogin trong ERD)
        /// </summary>
        public DateTime? LastLogin { get; set; }

        /// <summary>
        /// Số lần đăng nhập thất bại
        /// </summary>
        public int LoginAttempts { get; set; } = 0;

        /// <summary>
        /// Tài khoản có bị khóa không (sau nhiều lần đăng nhập sai)
        /// </summary>
        public bool IsLocked { get; set; } = false;

        /// <summary>
        /// Thời điểm tạo tài khoản (CreatedAt trong ERD)
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Lịch sử system logs
        /// </summary>
        public ICollection<SystemLog> SystemLogs { get; set; } = new List<SystemLog>();

        /// <summary>
        /// Danh sách Management assignments (user quản lý departments)
        /// </summary>
        public ICollection<Management> ManagementAssignments { get; set; } = new List<Management>();

        /// <summary>
        /// Danh sách Management được tạo bởi user này
        /// </summary>
        public ICollection<Management> CreatedManagements { get; set; } = new List<Management>();

        /// <summary>
        /// Danh sách Management được cập nhật bởi user này
        /// </summary>
        public ICollection<Management> UpdatedManagements { get; set; } = new List<Management>();
    }
}
