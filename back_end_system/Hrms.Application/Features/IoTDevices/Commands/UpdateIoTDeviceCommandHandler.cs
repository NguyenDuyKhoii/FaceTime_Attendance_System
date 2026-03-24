using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.Interface;

namespace Hrms.Application.Features.IoTDevices.Commands
{
    public class UpdateIoTDeviceCommandHandler : IRequestHandler<UpdateIoTDeviceCommand, bool>
    {
        private readonly IIoTDeviceRepository _deviceRepository;
        private readonly IProductionLineRepository _productionLineRepository;
        private readonly ILogger<UpdateIoTDeviceCommandHandler> _logger;

        public UpdateIoTDeviceCommandHandler(
            IIoTDeviceRepository deviceRepository,
            IProductionLineRepository productionLineRepository,
            ILogger<UpdateIoTDeviceCommandHandler> _logger)
        {
            _deviceRepository = deviceRepository;
            _productionLineRepository = productionLineRepository;
            this._logger = _logger;
        }

        public async Task<bool> Handle(UpdateIoTDeviceCommand request, CancellationToken cancellationToken)
        {
            var device = await _deviceRepository.GetByIdAsync(request.Id, cancellationToken);
            if (device == null)
            {
                throw new KeyNotFoundException($"Device với ID {request.Id} không tồn tại");
            }

            // Kiểm tra LineId tồn tại nếu có
            if (request.LineId.HasValue)
            {
                var lineExists = await _productionLineRepository.GetByIdAsync(request.LineId.Value, cancellationToken);
                if (lineExists == null)
                {
                    throw new KeyNotFoundException($"ProductionLine với ID {request.LineId} không tồn tại");
                }
            }

            device.DeviceName = request.DeviceName;
            device.DeviceType = request.DeviceType;
            device.LineId = request.LineId;
            device.LocationDesc = request.LocationDesc;
            device.IpAddress = request.IpAddress;
            device.MacAddress = request.MacAddress;
            device.Status = request.Status;

            _deviceRepository.Update(device);
            await _deviceRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Device updated: ID={DeviceId}, Name={DeviceName}", device.Id, device.DeviceName);

            return true;
        }
    }
}
