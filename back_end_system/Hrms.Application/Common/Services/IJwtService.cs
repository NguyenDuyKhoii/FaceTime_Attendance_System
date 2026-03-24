using Hrms.Application.DTOs.Auth;
using Hrms.Domain.Entities;

namespace Hrms.Application.Common.Services
{
    /// <summary>
    /// Interface cho JWT Service - tạo và validate JWT tokens
    /// </summary>
    public interface IJwtService
    {
        /// <summary>
        /// Tạo JWT token cho user
        /// </summary>
        string GenerateToken(UserAccount user, List<string> roles);

        /// <summary>
        /// Validate token và trả về username
        /// </summary>
        string? ValidateToken(string token);
    }
}
