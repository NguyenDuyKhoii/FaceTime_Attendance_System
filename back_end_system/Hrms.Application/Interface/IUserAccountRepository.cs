using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho UserAccount entity
    /// </summary>
    public interface IUserAccountRepository : IRepository<UserAccount>
    {
        /// <summary>
        /// Lấy user theo Username
        /// </summary>
        Task<UserAccount?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

        /// <summary>
        /// Kiểm tra Username đã tồn tại chưa
        /// </summary>
        Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy user với Role included
        /// </summary>
        Task<UserAccount?> GetByIdWithRoleAsync(Guid id, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy user theo Username với Role included
        /// </summary>
        Task<UserAccount?> GetByUsernameWithRoleAsync(string username, CancellationToken cancellationToken = default);
    }
}
