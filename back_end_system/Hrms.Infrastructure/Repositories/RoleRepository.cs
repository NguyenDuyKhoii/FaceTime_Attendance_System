using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho Role entity
    /// </summary>
    public class RoleRepository : Repository<Role>, IRoleRepository
    {
        public RoleRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Role?> GetByRoleCodeAsync(string roleCode, CancellationToken cancellationToken = default)
        {
            return await _dbSet.FirstOrDefaultAsync(r => r.RoleCode == roleCode, cancellationToken);
        }

        public async Task<Role?> GetByRoleNameAsync(string roleName, CancellationToken cancellationToken = default)
        {
            return await _dbSet.FirstOrDefaultAsync(r => r.RoleName == roleName, cancellationToken);
        }

        public async Task<IEnumerable<Role>> GetActiveRolesAsync(CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(r => r.IsActive)
                .ToListAsync(cancellationToken);
        }
    }
}
