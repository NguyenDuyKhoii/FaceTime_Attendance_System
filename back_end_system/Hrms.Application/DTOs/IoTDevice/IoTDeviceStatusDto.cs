namespace Hrms.Application.DTOs.IoTDevice
{
    public class IoTDeviceStatusDto
    {
        public int DeviceId { get; set; }
        public string Status { get; set; } = "Offline";
        public DateTime? LastHeartbeat { get; set; }
    }
}
