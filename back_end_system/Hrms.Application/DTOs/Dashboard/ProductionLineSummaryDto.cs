namespace Hrms.Application.DTOs.Dashboard
{
    public class ProductionLineSummaryDto
    {
        public string ProductionLine { get; set; } = null!;
        public int TotalEmployees { get; set; }
        public int Present { get; set; }
        public int Late { get; set; }
    }
}
