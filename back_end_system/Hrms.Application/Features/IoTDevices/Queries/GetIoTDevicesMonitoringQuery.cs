using Hrms.Application.DTOs.IoTDevice;
using MediatR;

namespace Hrms.Application.Features.IoTDevices.Queries
{
    public class GetIoTDevicesMonitoringQuery : IRequest<List<IoTDeviceMonitoringDto>>
    {
    }
}
