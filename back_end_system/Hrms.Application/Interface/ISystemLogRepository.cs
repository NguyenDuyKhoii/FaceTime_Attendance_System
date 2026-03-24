using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho SystemLog entity
    /// </summary>
    public interface ISystemLogRepository : IRepository<SystemLog>
    {
        /// <summary>
        /// Lấy logs theo UserId
        /// </summary>
        Task<IEnumerable<SystemLog>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy logs trong khoảng thời gian
        /// </summary>
        Task<IEnumerable<SystemLog>> GetByDateRangeAsync(
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy logs theo ActionType
        /// </summary>
        Task<IEnumerable<SystemLog>> GetByActionTypeAsync(string actionType, CancellationToken cancellationToken = default);
    }
}
