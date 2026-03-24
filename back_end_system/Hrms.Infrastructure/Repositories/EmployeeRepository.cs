using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho Employee entity
    /// </summary>
    public class EmployeeRepository : Repository<Employee>, IEmployeeRepository
    {
        public EmployeeRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Employee?> GetByEmployeeCodeAsync(string employeeCode, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(e => e.ShiftAssignments)
                    .ThenInclude(sa => sa.Shift)
                .Include(e => e.ShiftAssignments)
                    .ThenInclude(sa => sa.ProductionLine)
                .FirstOrDefaultAsync(e => e.EmployeeCode == employeeCode, cancellationToken);
        }

        public async Task<IEnumerable<Employee>> GetByDepartmentIdAsync(int departmentId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(e => e.ShiftAssignments)
                    .ThenInclude(sa => sa.Shift)
                .Include(e => e.ShiftAssignments)
                    .ThenInclude(sa => sa.ProductionLine)
                .Where(e => e.DepartmentId == departmentId)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Employee>> GetActiveEmployeesAsync(CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(e => e.ShiftAssignments)
                    .ThenInclude(sa => sa.Shift)
                .Include(e => e.ShiftAssignments)
                    .ThenInclude(sa => sa.ProductionLine)
                .Where(e => e.IsActive)
                .ToListAsync(cancellationToken);
        }

        public override async Task<IEnumerable<Employee>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(e => e.ShiftAssignments)
                    .ThenInclude(sa => sa.Shift)
                .Include(e => e.ShiftAssignments)
                    .ThenInclude(sa => sa.ProductionLine)
                .ToListAsync(cancellationToken);
        }

        public async Task<bool> EmployeeCodeExistsAsync(string employeeCode, CancellationToken cancellationToken = default)
        {
            return await _dbSet.AnyAsync(e => e.EmployeeCode == employeeCode, cancellationToken);
        }
    }
}
