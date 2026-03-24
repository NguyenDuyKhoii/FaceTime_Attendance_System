using MediatR;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.IoTDevices.Commands
{
    public class UpdateDeviceHeartbeatCommandHandler : IRequestHandler<UpdateDeviceHeartbeatCommand, bool>
    {
        private readonly IIoTDeviceRepository _repository;

        public UpdateDeviceHeartbeatCommandHandler(IIoTDeviceRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(UpdateDeviceHeartbeatCommand request, CancellationToken cancellationToken)
        {
            // Tìm device theo Id (trong Command này ta dùng int Id mapping từ DeviceId string if needed)
            // Lưu ý: Trong Entity IoTDevice, PK là Id (int).
            if (int.TryParse(request.DeviceId, out int id))
            {
                await _repository.UpdateHeartbeatAsync(id, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);
                return true;
            }
            
            return false;
        }
    }
}
