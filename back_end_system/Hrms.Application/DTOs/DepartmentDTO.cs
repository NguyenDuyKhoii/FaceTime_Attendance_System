namespace Hrms.Application.DTOs
{
    /// <summary>
    /// DTO cho Department
    /// </summary>
    public class DepartmentDTO
    {
        public int Id { get; set; }
        public string DepartmentCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
    }
}
