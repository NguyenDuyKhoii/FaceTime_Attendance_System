using MediatR;

namespace Hrms.Application.Features.IoTDevices.Commands
{
    /// <summary>
    /// Command cập nhật thông tin IoT Device
    /// </summary>
    public class UpdateIoTDeviceCommand : IRequest<bool>
    {
        public int Id { get; set; }
        public string DeviceName { get; set; } = null!;
        public string DeviceType { get; set; } = "ESP32-CAM";
        public int? LineId { get; set; }
        public string? LocationDesc { get; set; }
        public string? IpAddress { get; set; }
        public string? MacAddress { get; set; }
        public string Status { get; set; } = "Offline";
    }
}
