namespace Hrms.Application.DTOs.Reports
{
    public class MonthlyAttendanceReportItemDto
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeCode { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string ProductionLine { get; set; } = string.Empty;
        public int WorkingDays { get; set; }
        public int Late { get; set; }
        public int EarlyLeave { get; set; }
        public int LateMinutes { get; set; }
        public int EarlyLeaveMinutes { get; set; }
        public double OvertimeHours { get; set; }
        public double TotalHours { get; set; }
    }
}
