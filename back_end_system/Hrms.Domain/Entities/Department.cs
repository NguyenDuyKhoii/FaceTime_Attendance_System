namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity quản lý phòng ban
    /// Theo ERD: DepartmentId (PK), DepartmentCode, Name, Description
    /// </summary>
    public class Department
    {
        public int Id { get; set; }

        /// <summary>
        /// Mã phòng ban (unique)
        /// </summary>
        public string DepartmentCode { get; set; } = null!;

        /// <summary>
        /// Tên phòng ban
        /// </summary>
        public string Name { get; set; } = null!;

        /// <summary>
        /// Mô tả phòng ban
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Danh sách nhân viên trong phòng ban
        /// </summary>
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();

        /// <summary>
        /// Danh sách Management assignments (user quản lý department)
        /// </summary>
        public ICollection<Management> ManagementAssignments { get; set; } = new List<Management>();

        /// <summary>
        /// Danh sách Production Lines trong department
        /// </summary>
        public ICollection<ProductionLine> ProductionLines { get; set; } = new List<ProductionLine>();
    }
}