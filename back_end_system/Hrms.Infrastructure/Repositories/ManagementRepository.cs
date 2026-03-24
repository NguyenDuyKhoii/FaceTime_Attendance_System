using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho Management entity
    /// </summary>
    public class ManagementRepository : Repository<Management>, IManagementRepository
    {
        public ManagementRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Management>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(m => m.UserId == userId)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Management>> GetByDepartmentIdAsync(int departmentId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(m => m.DepartmentId == departmentId)
                .ToListAsync(cancellationToken);
        }

        public async Task<Management?> GetActiveAssignmentAsync(
            Guid userId, 
            int departmentId, 
            DateTime date, 
            CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(m => m.UserId == userId
                    && m.DepartmentId == departmentId
                    && m.IsActive
                    && m.FromDate <= date
                    && m.ToDate >= date)
                .FirstOrDefaultAsync(cancellationToken);
        }
    }
}
