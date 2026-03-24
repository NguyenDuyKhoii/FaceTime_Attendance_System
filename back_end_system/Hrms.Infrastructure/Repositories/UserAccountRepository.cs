using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho UserAccount entity
    /// </summary>
    public class UserAccountRepository : Repository<UserAccount>, IUserAccountRepository
    {
        public UserAccountRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<UserAccount?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
        }

        public async Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default)
        {
            return await _dbSet.AnyAsync(u => u.Username == username, cancellationToken);
        }

        public async Task<UserAccount?> GetByIdWithRoleAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        }

        public async Task<UserAccount?> GetByUsernameWithRoleAsync(string username, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
        }
    }
}
