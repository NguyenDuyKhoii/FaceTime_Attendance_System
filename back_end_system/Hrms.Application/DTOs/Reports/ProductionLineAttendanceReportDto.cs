namespace Hrms.Application.DTOs.Reports
{
    public class ProductionLineAttendanceReportDto
    {
        public int? ProductionLineId { get; set; }
        public string ProductionLine { get; set; } = string.Empty;
        public int TotalEmployees { get; set; }
        public int Present { get; set; }
        public int Late { get; set; }
    }
}
