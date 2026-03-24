namespace Hrms.Application.DTOs.Auth
{
    /// <summary>
    /// DTO cho request đăng nhập
    /// </summary>
    public class LoginRequestDto
    {
        /// <summary>
        /// Tên đăng nhập
        /// </summary>
        public string Username { get; set; } = null!;

        /// <summary>
        /// Mật khẩu
        /// </summary>
        public string Password { get; set; } = null!;
    }
}
