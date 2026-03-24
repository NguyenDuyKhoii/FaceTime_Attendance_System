namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity quản lý assignment của User quản lý Department
    /// Theo ERD: ManagementId (PK), UserId (FK), DepartmentId (FK), FromDate, ToDate, IsActive, CreatedAt, CreatedBy (FK), UpdatedAt, UpdatedBy (FK), Note
    /// </summary>
    public class Management
    {
        public Guid Id { get; set; }

        /// <summary>
        /// ID user được gán quản lý
        /// </summary>
        public Guid UserId { get; set; }
        public UserAccount UserAccount { get; set; } = null!;

        /// <summary>
        /// ID department được quản lý
        /// </summary>
        public int DepartmentId { get; set; }
        public Department Department { get; set; } = null!;

        /// <summary>
        /// Ngày bắt đầu quản lý
        /// </summary>
        public DateTime FromDate { get; set; }

        /// <summary>
        /// Ngày kết thúc quản lý
        /// </summary>
        public DateTime ToDate { get; set; }

        /// <summary>
        /// Assignment có active không
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Thời điểm tạo
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User tạo assignment này
        /// </summary>
        public Guid CreatedBy { get; set; }
        public UserAccount CreatedByUser { get; set; } = null!;

        /// <summary>
        /// Thời điểm cập nhật cuối cùng
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// User cập nhật assignment này lần cuối
        /// </summary>
        public Guid? UpdatedBy { get; set; }
        public UserAccount? UpdatedByUser { get; set; }

        /// <summary>
        /// Ghi chú
        /// </summary>
        public string? Note { get; set; }
    }
}
