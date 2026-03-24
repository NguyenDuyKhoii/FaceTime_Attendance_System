using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho Role entity
    /// </summary>
    public interface IRoleRepository : IRepository<Role>
    {
        /// <summary>
        /// Lấy role theo RoleCode
        /// </summary>
        Task<Role?> GetByRoleCodeAsync(string roleCode, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy role theo RoleName
        /// </summary>
        Task<Role?> GetByRoleNameAsync(string roleName, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy các roles active
        /// </summary>
        Task<IEnumerable<Role>> GetActiveRolesAsync(CancellationToken cancellationToken = default);
    }
}
