using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho FaceTemplate entity
    /// </summary>
    public interface IFaceTemplateRepository : IRepository<FaceTemplate>
    {
        /// <summary>
        /// Lấy face template theo EmployeeId (EmployeeId là PK)
        /// </summary>
        Task<FaceTemplate?> GetByEmployeeIdAsync(Guid employeeId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy tất cả face templates active
        /// </summary>
        Task<IEnumerable<FaceTemplate>> GetActiveTemplatesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy face templates với Employee included
        /// </summary>
        Task<IEnumerable<FaceTemplate>> GetActiveTemplatesWithEmployeeAsync(CancellationToken cancellationToken = default);
    }
}
