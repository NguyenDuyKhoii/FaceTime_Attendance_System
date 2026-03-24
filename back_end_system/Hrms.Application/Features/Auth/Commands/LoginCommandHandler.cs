using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.Common.Services;
using Hrms.Application.DTOs.Auth;
using Hrms.Application.Features.Auth.Commands;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.Auth.Commands
{
    /// <summary>
    /// Handler xử lý LoginCommand
    /// - Kiểm tra username/password
    /// - Tạo JWT token
    /// - Log system log
    /// </summary>
    public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponseDto>
    {
        private readonly IUserAccountRepository _userAccountRepository;
        private readonly ISystemLogRepository _systemLogRepository;
        private readonly IJwtService _jwtService;
        private readonly ILogger<LoginCommandHandler> _logger;

        public LoginCommandHandler(
            IUserAccountRepository userAccountRepository,
            ISystemLogRepository systemLogRepository,
            IJwtService jwtService,
            ILogger<LoginCommandHandler> logger)
        {
            _userAccountRepository = userAccountRepository;
            _systemLogRepository = systemLogRepository;
            _jwtService = jwtService;
            _logger = logger;
        }

        public async Task<LoginResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            // Tìm user theo username với Role included
            var user = await _userAccountRepository.GetByUsernameWithRoleAsync(request.Username, cancellationToken);

            if (user == null)
            {
                _logger.LogWarning("Login failed: User not found - {Username}", request.Username);
                throw new UnauthorizedAccessException("Tên đăng nhập hoặc mật khẩu không đúng");
            }

            // Kiểm tra account bị khóa
            if (user.IsLocked)
            {
                _logger.LogWarning("Login failed: Account is locked - {Username}", request.Username);
                throw new UnauthorizedAccessException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
            }

            // Verify password (sử dụng BCrypt)
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                // Tăng số lần đăng nhập thất bại
                user.LoginAttempts++;
                if (user.LoginAttempts >= 5) // Khóa sau 5 lần sai
                {
                    user.IsLocked = true;
                }
                _userAccountRepository.Update(user);
                await _userAccountRepository.SaveChangesAsync(cancellationToken);

                _logger.LogWarning("Login failed: Invalid password for user - {Username}, Attempts: {Attempts}", 
                    request.Username, user.LoginAttempts);
                throw new UnauthorizedAccessException("Tên đăng nhập hoặc mật khẩu không đúng");
            }

            // Lấy role (theo ERD: một user chỉ có một role)
            var roleCode = user.Role.RoleCode;

            // Tạo JWT token
            var token = _jwtService.GenerateToken(user, new List<string> { roleCode });

            // Cập nhật LastLogin và reset LoginAttempts
            user.LastLogin = DateTime.UtcNow;
            user.LoginAttempts = 0;
            user.IsLocked = false;
            _userAccountRepository.Update(user);

            // Tạo system log
            var systemLog = new SystemLog
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                ActionType = "Login",
                Description = $"User {user.Username} logged in successfully",
                LogLevel = "Info",
                Timestamp = DateTime.UtcNow
            };
            await _systemLogRepository.AddAsync(systemLog, cancellationToken);

            // Lưu tất cả thay đổi
            await _userAccountRepository.SaveChangesAsync(cancellationToken);
            await _systemLogRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("User logged in successfully: {Username}", request.Username);

            // Trả về response
            return new LoginResponseDto
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(1440), // 24 hours
                User = new UserInfoDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Roles = new List<string> { roleCode }
                }
            };
        }
    }
}
