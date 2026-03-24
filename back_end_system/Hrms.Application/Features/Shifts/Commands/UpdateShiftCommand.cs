using MediatR;

namespace Hrms.Application.Features.Shifts.Commands
{
    /// <summary>
    /// Command cập nhật Shift
    /// </summary>
    public class UpdateShiftCommand : IRequest<Unit>
    {
        public Guid Id { get; set; }
        public string ShiftCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string StartTime { get; set; } = null!;
        public string EndTime { get; set; } = null!;
        public string? BreakDuration { get; set; }
        public int AllowedLateMinutes { get; set; }
        public int AllowedEarlyLeaveMinutes { get; set; }
    }
}
