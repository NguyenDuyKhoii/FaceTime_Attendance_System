using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.Features.IoTDevices.Commands;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.IoTDevices.Commands
{
    /// <summary>
    /// Handler đăng ký IoT Device
    /// </summary>
    public class RegisterDeviceCommandHandler : IRequestHandler<RegisterDeviceCommand, int>
    {
        private readonly IIoTDeviceRepository _deviceRepository;
        private readonly IProductionLineRepository _productionLineRepository;
        private readonly ILogger<RegisterDeviceCommandHandler> _logger;

        public RegisterDeviceCommandHandler(
            IIoTDeviceRepository deviceRepository,
            IProductionLineRepository productionLineRepository,
            ILogger<RegisterDeviceCommandHandler> logger)
        {
            _deviceRepository = deviceRepository;
            _productionLineRepository = productionLineRepository;
            _logger = logger;
        }

        public async Task<int> Handle(RegisterDeviceCommand request, CancellationToken cancellationToken)
        {
            // Kiểm tra LineId tồn tại nếu có
            if (request.LineId.HasValue)
            {
                var lineExists = await _productionLineRepository.GetByIdAsync(request.LineId.Value, cancellationToken);
                if (lineExists == null)
                {
                    throw new KeyNotFoundException($"ProductionLine với ID {request.LineId} không tồn tại");
                }
            }

            var device = new IoTDevice
            {
                DeviceName = request.DeviceName,
                DeviceType = request.DeviceType,
                LineId = request.LineId,
                LocationDesc = request.LocationDesc,
                IpAddress = request.IpAddress,
                MacAddress = request.MacAddress,
                Status = "Offline",
                LastHeartbeat = null
            };

            await _deviceRepository.AddAsync(device, cancellationToken);
            await _deviceRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Device registered: {DeviceName} - {DeviceType}", device.DeviceName, device.DeviceType);

            return device.Id;
        }
    }
}
