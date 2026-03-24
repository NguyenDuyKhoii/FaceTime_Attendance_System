using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho Shift entity
    /// </summary>
    public class ShiftRepository : Repository<Shift>, IShiftRepository
    {
        public ShiftRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Shift?> GetByShiftCodeAsync(string shiftCode, CancellationToken cancellationToken = default)
        {
            return await _dbSet.FirstOrDefaultAsync(s => s.ShiftCode == shiftCode, cancellationToken);
        }

        public async Task<bool> ShiftCodeExistsAsync(string shiftCode, CancellationToken cancellationToken = default)
        {
            return await _dbSet.AnyAsync(s => s.ShiftCode == shiftCode, cancellationToken);
        }
    }
}
