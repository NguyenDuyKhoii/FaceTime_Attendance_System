using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho ProductionLine entity
    /// </summary>
    public interface IProductionLineRepository : IRepository<ProductionLine>
    {
        /// <summary>
        /// Lấy production lines theo DepartmentId
        /// </summary>
        Task<IEnumerable<ProductionLine>> GetByDepartmentIdAsync(int departmentId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy production lines active
        /// </summary>
        Task<IEnumerable<ProductionLine>> GetActiveLinesAsync(CancellationToken cancellationToken = default);
    }
}
