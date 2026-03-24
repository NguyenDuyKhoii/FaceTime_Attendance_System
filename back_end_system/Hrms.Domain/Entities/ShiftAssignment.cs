namespace Hrms.Domain.Entities
{
    public class ShiftAssignment
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;
        public Guid ShiftId { get; set; }
        public Shift Shift { get; set; } = null!;
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public int? ProductionLineId { get; set; }
        public ProductionLine? ProductionLine { get; set; }
    }

}
