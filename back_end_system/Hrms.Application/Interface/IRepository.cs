using System.Linq.Expressions;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Generic Repository Interface - Base interface cho tất cả repositories
    /// </summary>
    public interface IRepository<T> where T : class
    {
        /// <summary>
        /// Lấy entity theo ID
        /// </summary>
        Task<T?> GetByIdAsync(object id, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy tất cả entities
        /// </summary>
        Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Tìm entities theo điều kiện
        /// </summary>
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy entity đầu tiên thỏa điều kiện
        /// </summary>
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);

        /// <summary>
        /// Kiểm tra entity có tồn tại không
        /// </summary>
        Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);

        /// <summary>
        /// Thêm entity mới
        /// </summary>
        Task AddAsync(T entity, CancellationToken cancellationToken = default);

        /// <summary>
        /// Thêm nhiều entities
        /// </summary>
        Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);

        /// <summary>
        /// Cập nhật entity
        /// </summary>
        void Update(T entity);

        /// <summary>
        /// Cập nhật nhiều entities
        /// </summary>
        void UpdateRange(IEnumerable<T> entities);

        /// <summary>
        /// Xóa entity
        /// </summary>
        void Remove(T entity);

        /// <summary>
        /// Xóa nhiều entities
        /// </summary>
        void RemoveRange(IEnumerable<T> entities);

        /// <summary>
        /// Lấy IQueryable để thực hiện các truy vấn phức tạp (join, grouping, etc.)
        /// </summary>
        IQueryable<T> Query();

        /// <summary>
        /// Lưu thay đổi
        /// </summary>
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
