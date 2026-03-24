using MediatR;

namespace Hrms.Application.Features.Shifts.Commands
{
    /// <summary>
    /// Command tạo mới Shift
    /// </summary>
    public class CreateShiftCommand : IRequest<Guid>
    {
        public string ShiftCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string StartTime { get; set; } = null!;     
        public string EndTime { get; set; } = null!;       
        public string? BreakDuration { get; set; }
        public int AllowedLateMinutes { get; set; } = 15;
        public int AllowedEarlyLeaveMinutes { get; set; } = 15;
    }
}
