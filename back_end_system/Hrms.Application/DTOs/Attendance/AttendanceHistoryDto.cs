using System;
using System.Collections.Generic;

namespace Hrms.Application.DTOs.Attendance
{
    public class AttendanceHistoryDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = null!;
        public string? Department { get; set; }
        public string? ProductionLine { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public double TotalHours { get; set; }
        public string Status { get; set; } = null!;
    }

    public class AttendanceHistoryListDto
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalRecords { get; set; }
        public List<AttendanceHistoryDto> Data { get; set; } = new();
    }
}
