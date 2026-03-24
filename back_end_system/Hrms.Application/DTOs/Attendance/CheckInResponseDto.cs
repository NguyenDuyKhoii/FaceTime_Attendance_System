namespace Hrms.Application.DTOs.Attendance
{
    /// <summary>
    /// DTO cho response check-in/check-out
    /// </summary>
    public class CheckInResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = null!;
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public string? Status { get; set; } // OnTime, Late, EarlyLeave
        public int? LateMinutes { get; set; }
        public Guid? AttendanceRecordId { get; set; }
    }
}
