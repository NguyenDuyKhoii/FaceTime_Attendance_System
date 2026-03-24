using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho Management entity
    /// </summary>
    public interface IManagementRepository : IRepository<Management>
    {
        /// <summary>
        /// Lấy management assignments của user
        /// </summary>
        Task<IEnumerable<Management>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy management assignments của department
        /// </summary>
        Task<IEnumerable<Management>> GetByDepartmentIdAsync(int departmentId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy management assignment active trong khoảng thời gian
        /// </summary>
        Task<Management?> GetActiveAssignmentAsync(
            Guid userId, 
            int departmentId, 
            DateTime date, 
            CancellationToken cancellationToken = default);
    }
}
