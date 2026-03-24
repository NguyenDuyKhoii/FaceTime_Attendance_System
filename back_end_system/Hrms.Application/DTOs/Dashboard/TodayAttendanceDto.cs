namespace Hrms.Application.DTOs.Dashboard
{
    public class TodayAttendanceDto
    {
        public DateTime Date { get; set; }
        public int TotalEmployees { get; set; }
        public int Present { get; set; }
        public int Late { get; set; }
        public int Absent { get; set; }
    }
}
