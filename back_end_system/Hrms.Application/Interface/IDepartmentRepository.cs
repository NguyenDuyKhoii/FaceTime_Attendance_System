using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho Department entity
    /// </summary>
    public interface IDepartmentRepository : IRepository<Department>
    {
        /// <summary>
        /// Lấy department theo DepartmentCode
        /// </summary>
        Task<Department?> GetByDepartmentCodeAsync(string departmentCode, CancellationToken cancellationToken = default);

        /// <summary>
        /// Kiểm tra DepartmentCode đã tồn tại chưa
        /// </summary>
        Task<bool> DepartmentCodeExistsAsync(string departmentCode, CancellationToken cancellationToken = default);
    }
}
