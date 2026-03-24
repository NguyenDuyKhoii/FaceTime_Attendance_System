namespace Hrms.Domain.Entities
{
    public class Shift
    {
        public Guid Id { get; set; }
        public string ShiftCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public TimeSpan? BreakDuration { get; set; }
        public int AllowedLateMinutes { get; set; }
        public int AllowedEarlyLeaveMinutes { get; set; }

        public ICollection<ShiftAssignment> ShiftAssignments { get; set; } = new List<ShiftAssignment>();
    }
}