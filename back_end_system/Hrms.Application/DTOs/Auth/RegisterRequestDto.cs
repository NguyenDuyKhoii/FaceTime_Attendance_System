namespace Hrms.Application.DTOs.Auth
{
    /// <summary>
    /// DTO cho request đăng ký tài khoản
    /// </summary>
    public class RegisterRequestDto
    {
        /// <summary>
        /// Tên đăng nhập (unique)
        /// </summary>
        public string Username { get; set; } = null!;

        /// <summary>
        /// Mật khẩu
        /// </summary>
        public string Password { get; set; } = null!;

        /// <summary>
        /// Xác nhận mật khẩu
        /// </summary>
        public string ConfirmPassword { get; set; } = null!;

        /// <summary>
        /// ID Role (Admin, HR, Manager, Employee)
        /// </summary>
        public int RoleId { get; set; }
    }
}
