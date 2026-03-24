namespace Hrms.Application.DTOs.Reports
{
    public class DepartmentAttendanceReportDto
    {
        public int DepartmentId { get; set; }
        public string Department { get; set; } = string.Empty;
        public int TotalEmployees { get; set; }
        public int Present { get; set; }
        public int Late { get; set; }
    }
}
