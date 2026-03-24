namespace Hrms.Application.DTOs.Auth
{
    /// <summary>
    /// DTO cho response đăng ký tài khoản
    /// </summary>
    public class RegisterResponseDto
    {
        /// <summary>
        /// Thành công hay không
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Thông báo
        /// </summary>
        public string Message { get; set; } = null!;

        /// <summary>
        /// ID user vừa tạo
        /// </summary>
        public Guid? UserId { get; set; }

        /// <summary>
        /// Username
        /// </summary>
        public string? Username { get; set; }

        /// <summary>
        /// Role name
        /// </summary>
        public string? RoleName { get; set; }
    }
}
