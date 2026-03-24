using MediatR;

namespace Hrms.Application.Features.IoTDevices.Commands
{
    /// <summary>
    /// Command đăng ký IoT Device (ESP32-CAM)
    /// </summary>
    public class RegisterDeviceCommand : IRequest<int>
    {
        public string DeviceName { get; set; } = null!;
        public string DeviceType { get; set; } = "ESP32-CAM";
        public int? LineId { get; set; }
        public string? LocationDesc { get; set; }
        public string? IpAddress { get; set; }
        public string? MacAddress { get; set; }
    }
}
