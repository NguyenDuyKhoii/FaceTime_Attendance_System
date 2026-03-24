using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho ShiftAssignment entity
    /// </summary>
    public class ShiftAssignmentRepository : Repository<ShiftAssignment>, IShiftAssignmentRepository
    {
        public ShiftAssignmentRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<ShiftAssignment>> GetByEmployeeAndDateRangeAsync(
            Guid employeeId, 
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(sa => sa.Shift)
                .Where(sa => sa.EmployeeId == employeeId
                    && sa.FromDate <= toDate
                    && sa.ToDate >= fromDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<ShiftAssignment?> GetCurrentShiftAssignmentAsync(
            Guid employeeId, 
            DateTime date, 
            CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(sa => sa.Shift)
                .Include(sa => sa.ProductionLine)
                .Where(sa => sa.EmployeeId == employeeId
                    && sa.FromDate <= date
                    && sa.ToDate >= date)
                .OrderByDescending(sa => sa.FromDate)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<bool> HasOverlappingAssignmentAsync(
            Guid employeeId, 
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default)
        {
            return await _dbSet.AnyAsync(sa => sa.EmployeeId == employeeId
                && sa.FromDate <= toDate
                && sa.ToDate >= fromDate, cancellationToken);
        }

        public async Task<bool> HasOverlappingAssignmentAsync(
            Guid employeeId, 
            DateTime fromDate, 
            DateTime toDate, 
            Guid excludeId,
            CancellationToken cancellationToken = default)
        {
            return await _dbSet.AnyAsync(sa => sa.EmployeeId == employeeId
                && sa.Id != excludeId
                && sa.FromDate <= toDate
                && sa.ToDate >= fromDate, cancellationToken);
        }
        public async Task<IEnumerable<ShiftAssignment>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(sa => sa.Employee)
                .Include(sa => sa.Shift)
                .Include(sa => sa.ProductionLine)
                .ToListAsync(cancellationToken);
        }
    }
}
