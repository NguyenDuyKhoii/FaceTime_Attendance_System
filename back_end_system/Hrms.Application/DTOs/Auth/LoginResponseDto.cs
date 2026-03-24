namespace Hrms.Application.DTOs.Auth
{
    /// <summary>
    /// DTO cho response đăng nhập
    /// </summary>
    public class LoginResponseDto
    {
        /// <summary>
        /// JWT Token
        /// </summary>
        public string Token { get; set; } = null!;

        /// <summary>
        /// Refresh token (nếu có)
        /// </summary>
        public string? RefreshToken { get; set; }

        /// <summary>
        /// Thời gian hết hạn (UTC)
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// Thông tin user
        /// </summary>
        public UserInfoDto User { get; set; } = null!;
    }

    /// <summary>
    /// Thông tin user sau khi đăng nhập
    /// </summary>
    public class UserInfoDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = null!;
        public List<string> Roles { get; set; } = new();
    }

}
