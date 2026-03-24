using MediatR;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Application.Features.IoTDevices.Queries;

namespace Hrms.Application.Features.IoTDevices.Queries
{
    public class GetIoTDevicesQueryHandler : IRequestHandler<GetIoTDevicesQuery, List<IoTDevice>>
    {
        private readonly IIoTDeviceRepository _repository;

        public GetIoTDevicesQueryHandler(IIoTDeviceRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<IoTDevice>> Handle(GetIoTDevicesQuery request, CancellationToken cancellationToken)
        {
            var devices = await _repository.GetAllAsync(cancellationToken);
            return devices.ToList();
        }
    }
}
