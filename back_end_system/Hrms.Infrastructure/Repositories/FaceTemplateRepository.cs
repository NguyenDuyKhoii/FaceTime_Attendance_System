using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho FaceTemplate entity
    /// </summary>
    public class FaceTemplateRepository : Repository<FaceTemplate>, IFaceTemplateRepository
    {
        public FaceTemplateRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<FaceTemplate?> GetByEmployeeIdAsync(Guid employeeId, CancellationToken cancellationToken = default)
        {
            return await _dbSet.FindAsync(new object[] { employeeId }, cancellationToken);
        }

        public async Task<IEnumerable<FaceTemplate>> GetActiveTemplatesAsync(CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(ft => ft.IsActive)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<FaceTemplate>> GetActiveTemplatesWithEmployeeAsync(CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(ft => ft.Employee)
                .Where(ft => ft.IsActive)
                .ToListAsync(cancellationToken);
        }
    }
}
