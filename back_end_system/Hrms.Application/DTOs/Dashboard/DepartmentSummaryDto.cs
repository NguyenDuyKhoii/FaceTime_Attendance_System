namespace Hrms.Application.DTOs.Dashboard
{
    public class DepartmentSummaryDto
    {
        public string Department { get; set; } = null!;
        public int TotalEmployees { get; set; }
        public int Present { get; set; }
        public int Late { get; set; }
    }
}
