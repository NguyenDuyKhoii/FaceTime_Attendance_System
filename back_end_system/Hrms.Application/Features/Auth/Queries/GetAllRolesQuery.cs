using MediatR;
using Hrms.Application.DTOs.Auth;

namespace Hrms.Application.Features.Auth.Queries
{
    /// <summary>
    /// Query lấy danh sách tất cả roles (để hiển thị trong form đăng ký)
    /// </summary>
    public class GetAllRolesQuery : IRequest<List<RoleDto>>
    {
    }

    /// <summary>
    /// DTO cho Role
    /// </summary>
    public class RoleDto
    {
        public int Id { get; set; }
        public string RoleCode { get; set; } = null!;
        public string RoleName { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }
}
