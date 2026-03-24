using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation cho AttendanceSummary entity
    /// </summary>
    public class AttendanceSummaryRepository : Repository<AttendanceSummary>, IAttendanceSummaryRepository
    {
        public AttendanceSummaryRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<AttendanceSummary?> GetByEmployeeAndDateAsync(
            Guid employeeId, 
            DateTime recordDate, 
            CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .FirstOrDefaultAsync(s => s.EmployeeId == employeeId 
                    && s.RecordDate.Date == recordDate.Date, cancellationToken);
        }

        public async Task<IEnumerable<AttendanceSummary>> GetByEmployeeAndDateRangeAsync(
            Guid employeeId, 
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(s => s.EmployeeId == employeeId
                    && s.RecordDate.Date >= fromDate.Date
                    && s.RecordDate.Date <= toDate.Date)
                .OrderBy(s => s.RecordDate)
                .ToListAsync(cancellationToken);
        }
    }
}
