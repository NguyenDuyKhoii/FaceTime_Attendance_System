using Hrms.Application.DTOs.IoTDevice;
using MediatR;

namespace Hrms.Application.Features.IoTDevices.Queries
{
    public class GetIoTDeviceStatusQuery : IRequest<IoTDeviceStatusDto?>
    {
        public int DeviceId { get; set; }
    }
}
