using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho ShiftAssignment entity
    /// </summary>
    public interface IShiftAssignmentRepository : IRepository<ShiftAssignment>
    {
        /// <summary>
        /// Lấy shift assignments của employee trong khoảng thời gian
        /// </summary>
        Task<IEnumerable<ShiftAssignment>> GetByEmployeeAndDateRangeAsync(
            Guid employeeId, 
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy shift assignment hiện tại của employee (cho một ngày cụ thể)
        /// </summary>
        Task<ShiftAssignment?> GetCurrentShiftAssignmentAsync(
            Guid employeeId, 
            DateTime date, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Kiểm tra có overlap với shift assignment khác không
        /// </summary>
        Task<bool> HasOverlappingAssignmentAsync(
            Guid employeeId, 
            DateTime fromDate, 
            DateTime toDate, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Kiểm tra có overlap với shift assignment khác không (ngoại trừ cái đang edit)
        /// </summary>
        Task<bool> HasOverlappingAssignmentAsync(
            Guid employeeId, 
            DateTime fromDate, 
            DateTime toDate, 
            Guid excludeId,
            CancellationToken cancellationToken = default);
        /// <summary>
        /// Lấy tất cả shift assignments bao gồm thông tin chi tiết (Employee, Shift, ProductionLine)
        /// </summary>
        Task<IEnumerable<ShiftAssignment>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default);
    }
}
