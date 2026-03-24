using MediatR;
using Hrms.Application.DTOs.Auth;

namespace Hrms.Application.Features.Auth.Commands
{
    /// <summary>
    /// Command đăng nhập - sử dụng MediatR pattern
    /// </summary>
    public class LoginCommand : IRequest<LoginResponseDto>
    {
        public string Username { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
