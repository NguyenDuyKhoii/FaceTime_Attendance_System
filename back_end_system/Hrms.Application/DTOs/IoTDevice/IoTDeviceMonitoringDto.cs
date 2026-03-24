namespace Hrms.Application.DTOs.IoTDevice
{
    public class IoTDeviceMonitoringDto
    {
        public int DeviceId { get; set; }
        public string Location { get; set; } = string.Empty;
        public string Status { get; set; } = "Offline";
        public DateTime? LastHeartbeat { get; set; }
    }
}
