using Hrms.Domain.Entities;

namespace Hrms.Application.Features.IoTDevices.Queries
{
    internal static class IoTDeviceStatusHelper
    {
        private static readonly TimeSpan OfflineThreshold = TimeSpan.FromMinutes(5);

        public static string ResolveStatus(DateTime? lastHeartbeat, DateTime nowUtc)
        {
            if (!lastHeartbeat.HasValue)
            {
                return "Offline";
            }

            return nowUtc - lastHeartbeat.Value > OfflineThreshold ? "Offline" : "Online";
        }

        public static SystemLog BuildOfflineLog(IoTDevice device)
        {
            return new SystemLog
            {
                Id = Guid.NewGuid(),
                UserId = null,
                ActionType = "DeviceOffline",
                Description = $"Device {device.Id} ({device.DeviceName}) is offline. Last heartbeat: {device.LastHeartbeat:yyyy-MM-dd HH:mm:ss}",
                LogLevel = "Warning",
                Timestamp = DateTime.UtcNow,
                EntityType = "IoTDevice",
                AdditionalData = $"{{\"deviceId\":{device.Id},\"location\":\"{EscapeForJson(device.LocationDesc)}\",\"status\":\"Offline\"}}"
            };
        }

        private static string EscapeForJson(string? text)
        {
            return (text ?? string.Empty).Replace("\"", "\\\"");
        }
    }
}
