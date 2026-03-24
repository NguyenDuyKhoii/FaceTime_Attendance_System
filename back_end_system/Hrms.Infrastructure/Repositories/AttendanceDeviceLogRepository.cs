using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho AttendanceDeviceLog entity
    /// </summary>
    public class AttendanceDeviceLogRepository : Repository<AttendanceDeviceLog>, IAttendanceDeviceLogRepository
    {
        public AttendanceDeviceLogRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<AttendanceDeviceLog>> GetByDeviceIdAsync(int deviceId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(adl => adl.DeviceId == deviceId)
                .OrderByDescending(adl => adl.CapturedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<AttendanceDeviceLog>> GetByEmployeeIdAsync(Guid employeeId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(adl => adl.EmployeeId == employeeId)
                .OrderByDescending(adl => adl.CapturedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<AttendanceDeviceLog>> GetByDateRangeAsync(
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(adl => adl.CapturedAt >= fromDate && adl.CapturedAt <= toDate)
                .OrderByDescending(adl => adl.CapturedAt)
                .ToListAsync(cancellationToken);
        }
    }
}
