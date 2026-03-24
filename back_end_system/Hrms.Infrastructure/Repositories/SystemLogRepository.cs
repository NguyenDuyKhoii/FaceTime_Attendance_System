using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho SystemLog entity
    /// </summary>
    public class SystemLogRepository : Repository<SystemLog>, ISystemLogRepository
    {
        public SystemLogRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<SystemLog>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(sl => sl.UserId == userId)
                .OrderByDescending(sl => sl.Timestamp)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<SystemLog>> GetByDateRangeAsync(
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(sl => sl.Timestamp >= fromDate && sl.Timestamp <= toDate)
                .OrderByDescending(sl => sl.Timestamp)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<SystemLog>> GetByActionTypeAsync(string actionType, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(sl => sl.ActionType == actionType)
                .OrderByDescending(sl => sl.Timestamp)
                .ToListAsync(cancellationToken);
        }
    }
}
