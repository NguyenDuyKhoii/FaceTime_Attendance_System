using MediatR;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.IoTDevices.Queries
{
    public class GetIoTDevicesQuery : IRequest<List<IoTDevice>>
    {
    }
}
