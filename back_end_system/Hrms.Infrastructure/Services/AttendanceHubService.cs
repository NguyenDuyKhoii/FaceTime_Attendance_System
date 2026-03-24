using Microsoft.AspNetCore.SignalR;
using Hrms.Application.Interface;
using Hrms.Infrastructure.Hubs;

namespace Hrms.Infrastructure.Services
{
    public class AttendanceHubService : IAttendanceHubService
    {
        private readonly IHubContext<AttendanceHub> _hubContext;

        public AttendanceHubService(IHubContext<AttendanceHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task NotifyAttendanceUpdatedAsync()
        {
            await _hubContext.Clients.All.SendAsync("AttendanceUpdated");
        }
    }
}
