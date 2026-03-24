using MediatR;

namespace Hrms.Application.Features.IoTDevices.Commands
{
    public class UpdateDeviceHeartbeatCommand : IRequest<bool>
    {
        public string DeviceId { get; set; } = null!;
    }
}
