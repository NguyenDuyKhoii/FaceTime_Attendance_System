namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity quản lý các thiết bị IoT (ESP32-CAM) trong hệ thống
    /// Theo ERD: DeviceId (PK), DeviceName, DeviceType, LineId (FK to ProductionLine), LocationDesc, IpAddress, MacAddress, Status, LastHeartbeat
    /// </summary>
    public class IoTDevice
    {
        public int Id { get; set; }

        /// <summary>
        /// Tên thiết bị
        /// </summary>
        public string DeviceName { get; set; } = null!;

        /// <summary>
        /// Loại thiết bị (ESP32-CAM, Camera, etc.)
        /// </summary>
        public string DeviceType { get; set; } = null!;

        /// <summary>
        /// ID Production Line mà thiết bị được gán (LineId trong ERD)
        /// </summary>
        public int? LineId { get; set; }
        public ProductionLine? ProductionLine { get; set; }

        /// <summary>
        /// Mô tả vị trí lắp đặt (LocationDesc trong ERD)
        /// </summary>
        public string? LocationDesc { get; set; }

        /// <summary>
        /// Địa chỉ IP của thiết bị
        /// </summary>
        public string? IpAddress { get; set; }

        /// <summary>
        /// Địa chỉ MAC của thiết bị
        /// </summary>
        public string? MacAddress { get; set; }

        /// <summary>
        /// Trạng thái thiết bị: Online, Offline, Maintenance
        /// </summary>
        public string Status { get; set; } = "Offline";

        /// <summary>
        /// Thời điểm heartbeat cuối cùng từ thiết bị
        /// </summary>
        public DateTime? LastHeartbeat { get; set; }

        /// <summary>
        /// Navigation property: Lịch sử log từ thiết bị
        /// </summary>
        public ICollection<AttendanceDeviceLog> DeviceLogs { get; set; } = new List<AttendanceDeviceLog>();
    }
}
