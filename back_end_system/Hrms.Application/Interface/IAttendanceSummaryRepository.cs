using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho AttendanceSummary entity
    /// </summary>
    public interface IAttendanceSummaryRepository : IRepository<AttendanceSummary>
    {
        /// <summary>
        /// Lấy attendance summary của employee trong một ngày
        /// </summary>
        Task<AttendanceSummary?> GetByEmployeeAndDateAsync(
            Guid employeeId, 
            DateTime recordDate, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy attendance summaries của employee trong khoảng thời gian
        /// </summary>
        Task<IEnumerable<AttendanceSummary>> GetByEmployeeAndDateRangeAsync(
            Guid employeeId, 
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default);
    }
}
