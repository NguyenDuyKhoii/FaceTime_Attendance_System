using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho AttendanceRecord entity
    /// </summary>
    public interface IAttendanceRecordRepository : IRepository<AttendanceRecord>
    {
        /// <summary>
        /// Lấy attendance record của employee trong một ngày
        /// </summary>
        Task<AttendanceRecord?> GetByEmployeeAndDateAsync(
            Guid employeeId, 
            DateTime workDate, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy attendance records của employee trong khoảng thời gian
        /// </summary>
        Task<IEnumerable<AttendanceRecord>> GetByEmployeeAndDateRangeAsync(
            Guid employeeId, 
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy attendance record với Shift included
        /// </summary>
        Task<AttendanceRecord?> GetByIdWithShiftAsync(Guid id, CancellationToken cancellationToken = default);
    }
}
