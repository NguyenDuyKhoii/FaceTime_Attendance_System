namespace Hrms.Application.DTOs.PythonAI
{
    /// <summary>
    /// DTO cho request enrollment đến Python AI Service
    /// </summary>
    public class PythonEnrollRequestDto
    {
        /// <summary>
        /// Person ID (sử dụng EmployeeCode)
        /// </summary>
        public string PersonId { get; set; } = string.Empty;

        /// <summary>
        /// Tên nhân viên
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Ảnh base64
        /// </summary>
        public string ImageBase64 { get; set; } = string.Empty;
    }
}
