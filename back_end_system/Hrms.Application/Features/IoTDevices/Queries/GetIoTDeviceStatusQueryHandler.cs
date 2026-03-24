using Hrms.Application.DTOs.IoTDevice;
using Hrms.Application.Interface;
using MediatR;

namespace Hrms.Application.Features.IoTDevices.Queries
{
    public class GetIoTDeviceStatusQueryHandler : IRequestHandler<GetIoTDeviceStatusQuery, IoTDeviceStatusDto?>
    {
        private readonly IIoTDeviceRepository _deviceRepository;
        private readonly ISystemLogRepository _systemLogRepository;

        public GetIoTDeviceStatusQueryHandler(
            IIoTDeviceRepository deviceRepository,
            ISystemLogRepository systemLogRepository)
        {
            _deviceRepository = deviceRepository;
            _systemLogRepository = systemLogRepository;
        }

        public async Task<IoTDeviceStatusDto?> Handle(GetIoTDeviceStatusQuery request, CancellationToken cancellationToken)
        {
            var device = await _deviceRepository.GetByIdAsync(request.DeviceId, cancellationToken);
            if (device == null)
            {
                return null;
            }

            var resolvedStatus = IoTDeviceStatusHelper.ResolveStatus(device.LastHeartbeat, DateTime.UtcNow);

            if (!string.Equals(device.Status, resolvedStatus, StringComparison.OrdinalIgnoreCase))
            {
                var previousStatus = device.Status;
                device.Status = resolvedStatus;
                _deviceRepository.Update(device);
                await _deviceRepository.SaveChangesAsync(cancellationToken);

                if (resolvedStatus == "Offline" && !string.Equals(previousStatus, "Offline", StringComparison.OrdinalIgnoreCase))
                {
                    await _systemLogRepository.AddAsync(IoTDeviceStatusHelper.BuildOfflineLog(device), cancellationToken);
                    await _systemLogRepository.SaveChangesAsync(cancellationToken);
                }
            }

            return new IoTDeviceStatusDto
            {
                DeviceId = device.Id,
                Status = device.Status,
                LastHeartbeat = device.LastHeartbeat
            };
        }
    }
}
