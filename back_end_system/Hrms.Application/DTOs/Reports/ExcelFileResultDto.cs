namespace Hrms.Application.DTOs.Reports
{
    public class ExcelFileResultDto
    {
        public byte[] Content { get; set; } = Array.Empty<byte>();
        public string ContentType { get; set; } = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        public string FileName { get; set; } = "attendance-report.xlsx";
    }
}
