using System;
using Hrms.Domain.Enums;

namespace Hrms.Application.DTOs.Attendance
{
    public class AttendanceDetailDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = null!;
        public string? Department { get; set; }
        public string? ProductionLine { get; set; }
        public DateTime WorkDate { get; set; }

        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }

        public int LateMinutes { get; set; }
        public int EarlyLeaveMinutes { get; set; }
        public double TotalHours { get; set; }

        public string Status { get; set; } = null!;

        public string? DeviceId { get; set; }
        public string? Location { get; set; }
        public float? ConfidenceScore { get; set; }

        public string Source { get; set; } = null!;
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
