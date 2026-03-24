using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho Department entity
    /// </summary>
    public class DepartmentRepository : Repository<Department>, IDepartmentRepository
    {
        public DepartmentRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Department?> GetByDepartmentCodeAsync(string departmentCode, CancellationToken cancellationToken = default)
        {
            return await _dbSet.FirstOrDefaultAsync(d => d.DepartmentCode == departmentCode, cancellationToken);
        }

        public async Task<bool> DepartmentCodeExistsAsync(string departmentCode, CancellationToken cancellationToken = default)
        {
            return await _dbSet.AnyAsync(d => d.DepartmentCode == departmentCode, cancellationToken);
        }
    }
}
