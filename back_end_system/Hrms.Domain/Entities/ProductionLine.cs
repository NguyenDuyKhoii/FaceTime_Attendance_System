namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity quản lý Production Line (dây chuyền sản xuất)
    /// Theo ERD: Line_id (PK), Line_name, DepartmentId (FK), Capacity, MachineCount, Status
    /// </summary>
    public class ProductionLine
    {
        public int Id { get; set; }

        /// <summary>
        /// Tên dây chuyền sản xuất
        /// </summary>
        public string LineName { get; set; } = null!;

        /// <summary>
        /// ID phòng ban chứa dây chuyền này
        /// </summary>
        public int DepartmentId { get; set; }
        public Department Department { get; set; } = null!;

        /// <summary>
        /// Sức chứa (số lượng nhân viên tối đa)
        /// </summary>
        public int? Capacity { get; set; }

        /// <summary>
        /// Số lượng máy móc
        /// </summary>
        public int? MachineCount { get; set; }

        /// <summary>
        /// Trạng thái: Active, Inactive, Maintenance
        /// </summary>
        public string Status { get; set; } = "Active";

        /// <summary>
        /// Danh sách IoT Devices trong production line này
        /// </summary>
        public ICollection<IoTDevice> IoTDevices { get; set; } = new List<IoTDevice>();
    }
}
