namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity quản lý roles trong hệ thống
    /// Theo ERD: RoleId (PK), RoleCode, RoleName, Permissions, Description, IsActive
    /// </summary>
    public class Role
    {
        public int Id { get; set; }

        /// <summary>
        /// Mã role (unique)
        /// </summary>
        public string RoleCode { get; set; } = null!;

        /// <summary>
        /// Tên role
        /// </summary>
        public string RoleName { get; set; } = null!;

        /// <summary>
        /// Danh sách permissions (JSON format hoặc comma-separated)
        /// </summary>
        public string? Permissions { get; set; }

        /// <summary>
        /// Mô tả role
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Role có active không
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Navigation property: Danh sách users có role này (one-to-many)
        /// </summary>
        public ICollection<UserAccount> Users { get; set; } = new List<UserAccount>();
    }
}
