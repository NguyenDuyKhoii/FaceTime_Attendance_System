using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho Employee entity
    /// </summary>
    public interface IEmployeeRepository : IRepository<Employee>
    {
        /// <summary>
        /// Lấy employee theo EmployeeCode
        /// </summary>
        Task<Employee?> GetByEmployeeCodeAsync(string employeeCode, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy employees theo DepartmentId
        /// </summary>
        Task<IEnumerable<Employee>> GetByDepartmentIdAsync(int departmentId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy employees active
        /// </summary>
        Task<IEnumerable<Employee>> GetActiveEmployeesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Kiểm tra EmployeeCode đã tồn tại chưa
        /// </summary>
        Task<bool> EmployeeCodeExistsAsync(string employeeCode, CancellationToken cancellationToken = default);
    }
}
