using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.DTOs.Auth;
using Hrms.Application.Features.Auth.Commands;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.Auth.Commands
{
    /// <summary>
    /// Handler xử lý RegisterCommand
    /// - Kiểm tra username đã tồn tại chưa
    /// - Kiểm tra role tồn tại
    /// - Hash password bằng BCrypt
    /// - Tạo UserAccount mới
    /// - Log system log
    /// </summary>
    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResponseDto>
    {
        private readonly IUserAccountRepository _userAccountRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly ISystemLogRepository _systemLogRepository;
        private readonly ILogger<RegisterCommandHandler> _logger;

        public RegisterCommandHandler(
            IUserAccountRepository userAccountRepository,
            IRoleRepository roleRepository,
            ISystemLogRepository systemLogRepository,
            ILogger<RegisterCommandHandler> logger)
        {
            _userAccountRepository = userAccountRepository;
            _roleRepository = roleRepository;
            _systemLogRepository = systemLogRepository;
            _logger = logger;
        }

        public async Task<RegisterResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            // 1. Kiểm tra username đã tồn tại chưa
            var usernameExists = await _userAccountRepository.UsernameExistsAsync(request.Username, cancellationToken);
            if (usernameExists)
            {
                return new RegisterResponseDto
                {
                    Success = false,
                    Message = "Username đã tồn tại. Vui lòng chọn username khác."
                };
            }

            // 2. Kiểm tra role tồn tại
            var role = await _roleRepository.GetByIdAsync(request.RoleId, cancellationToken);
            if (role == null)
            {
                return new RegisterResponseDto
                {
                    Success = false,
                    Message = "Role không tồn tại."
                };
            }

            // 3. Hash password bằng BCrypt
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // 4. Tạo UserAccount mới
            var newUser = new UserAccount
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                PasswordHash = passwordHash,
                RoleId = request.RoleId,
                LoginAttempts = 0,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            };

            await _userAccountRepository.AddAsync(newUser, cancellationToken);
            await _userAccountRepository.SaveChangesAsync(cancellationToken);

            // 5. Tạo system log
            var systemLog = new SystemLog
            {
                Id = Guid.NewGuid(),
                UserId = newUser.Id,
                ActionType = "Register",
                Description = $"User {newUser.Username} registered with role {role.RoleName}",
                EntityType = "UserAccount",
                EntityId = newUser.Id,
                LogLevel = "Info",
                Timestamp = DateTime.UtcNow
            };
            await _systemLogRepository.AddAsync(systemLog, cancellationToken);
            await _systemLogRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("User registered successfully: {Username} with role {RoleName}", 
                request.Username, role.RoleName);

            // 6. Trả về response
            return new RegisterResponseDto
            {
                Success = true,
                Message = "Đăng ký tài khoản thành công",
                UserId = newUser.Id,
                Username = newUser.Username,
                RoleName = role.RoleName
            };
        }
    }
}
