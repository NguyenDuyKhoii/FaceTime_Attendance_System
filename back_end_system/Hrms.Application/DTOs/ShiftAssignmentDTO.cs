using System;

namespace Hrms.Application.DTOs
{
    public class ShiftAssignmentDTO
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = null!;
        public Guid ShiftId { get; set; }
        public string ShiftName { get; set; } = null!;
        public int? ProductionLineId { get; set; }
        public string? ProductionLineName { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
    }
}
