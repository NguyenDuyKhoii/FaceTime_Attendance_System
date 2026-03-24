using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho AttendanceDeviceLog entity
    /// </summary>
    public interface IAttendanceDeviceLogRepository : IRepository<AttendanceDeviceLog>
    {
        /// <summary>
        /// Lấy logs theo DeviceId
        /// </summary>
        Task<IEnumerable<AttendanceDeviceLog>> GetByDeviceIdAsync(int deviceId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy logs theo EmployeeId
        /// </summary>
        Task<IEnumerable<AttendanceDeviceLog>> GetByEmployeeIdAsync(Guid employeeId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy logs trong khoảng thời gian
        /// </summary>
        Task<IEnumerable<AttendanceDeviceLog>> GetByDateRangeAsync(
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default);
    }
}
