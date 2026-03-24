using Hrms.Domain.Entities;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Repository interface cho Shift entity
    /// </summary>
    public interface IShiftRepository : IRepository<Shift>
    {
        /// <summary>
        /// Lấy shift theo ShiftCode
        /// </summary>
        Task<Shift?> GetByShiftCodeAsync(string shiftCode, CancellationToken cancellationToken = default);

        /// <summary>
        /// Kiểm tra ShiftCode đã tồn tại chưa
        /// </summary>
        Task<bool> ShiftCodeExistsAsync(string shiftCode, CancellationToken cancellationToken = default);
    }
}
