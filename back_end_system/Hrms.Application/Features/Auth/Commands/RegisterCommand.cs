using MediatR;
using Hrms.Application.DTOs.Auth;

namespace Hrms.Application.Features.Auth.Commands
{
    /// <summary>
    /// Command đăng ký tài khoản - sử dụng MediatR pattern
    /// </summary>
    public class RegisterCommand : IRequest<RegisterResponseDto>
    {
        public string Username { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string ConfirmPassword { get; set; } = null!;
        public int RoleId { get; set; }
    }
}
