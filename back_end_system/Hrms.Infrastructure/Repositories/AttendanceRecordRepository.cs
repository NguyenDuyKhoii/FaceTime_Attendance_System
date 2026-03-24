using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho AttendanceRecord entity
    /// </summary>
    public class AttendanceRecordRepository : Repository<AttendanceRecord>, IAttendanceRecordRepository
    {
        public AttendanceRecordRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<AttendanceRecord?> GetByEmployeeAndDateAsync(
            Guid employeeId, 
            DateTime workDate, 
            CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .FirstOrDefaultAsync(ar => ar.EmployeeId == employeeId 
                    && ar.WorkDate.Date == workDate.Date, cancellationToken);
        }

        public async Task<IEnumerable<AttendanceRecord>> GetByEmployeeAndDateRangeAsync(
            Guid employeeId, 
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(ar => ar.EmployeeId == employeeId
                    && ar.WorkDate.Date >= fromDate.Date
                    && ar.WorkDate.Date <= toDate.Date)
                .OrderBy(ar => ar.WorkDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<AttendanceRecord?> GetByIdWithShiftAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(ar => ar.Shift)
                .FirstOrDefaultAsync(ar => ar.Id == id, cancellationToken);
        }
    }
}
