using Hrms.Application.DTOs.IoTDevice;
using Hrms.Application.Interface;
using MediatR;

namespace Hrms.Application.Features.IoTDevices.Queries
{
    public class GetIoTDevicesMonitoringQueryHandler : IRequestHandler<GetIoTDevicesMonitoringQuery, List<IoTDeviceMonitoringDto>>
    {
        private readonly IIoTDeviceRepository _deviceRepository;
        private readonly ISystemLogRepository _systemLogRepository;

        public GetIoTDevicesMonitoringQueryHandler(
            IIoTDeviceRepository deviceRepository,
            ISystemLogRepository systemLogRepository)
        {
            _deviceRepository = deviceRepository;
            _systemLogRepository = systemLogRepository;
        }

        public async Task<List<IoTDeviceMonitoringDto>> Handle(GetIoTDevicesMonitoringQuery request, CancellationToken cancellationToken)
        {
            var nowUtc = DateTime.UtcNow;
            var devices = (await _deviceRepository.GetAllAsync(cancellationToken)).ToList();

            var deviceUpdated = false;
            var logs = new List<Domain.Entities.SystemLog>();

            foreach (var device in devices)
            {
                var resolvedStatus = IoTDeviceStatusHelper.ResolveStatus(device.LastHeartbeat, nowUtc);
                if (!string.Equals(device.Status, resolvedStatus, StringComparison.OrdinalIgnoreCase))
                {
                    var previousStatus = device.Status;
                    device.Status = resolvedStatus;
                    _deviceRepository.Update(device);
                    deviceUpdated = true;

                    if (resolvedStatus == "Offline" && !string.Equals(previousStatus, "Offline", StringComparison.OrdinalIgnoreCase))
                    {
                        logs.Add(IoTDeviceStatusHelper.BuildOfflineLog(device));
                    }
                }
            }

            if (deviceUpdated)
            {
                await _deviceRepository.SaveChangesAsync(cancellationToken);
            }

            if (logs.Count > 0)
            {
                await _systemLogRepository.AddRangeAsync(logs, cancellationToken);
                await _systemLogRepository.SaveChangesAsync(cancellationToken);
            }

            return devices
                .OrderBy(d => d.Id)
                .Select(d => new IoTDeviceMonitoringDto
                {
                    DeviceId = d.Id,
                    Location = d.LocationDesc ?? string.Empty,
                    Status = d.Status,
                    LastHeartbeat = d.LastHeartbeat
                })
                .ToList();
        }
    }
}
