namespace Hrms.Domain.Constants
{
    /// <summary>
    /// Các hằng số định nghĩa Role trong hệ thống
    /// </summary>
    public static class UserRoles
    {
        public const int Admin = 1;
        public const int HR = 2;
        public const int Manager = 3;
        public const int Employee = 4;

        public static string GetRoleName(int roleId) => roleId switch
        {
            Admin => "Admin",
            HR => "HR",
            Manager => "Manager",
            Employee => "Employee",
            _ => "Unknown"
        };
    }
}
