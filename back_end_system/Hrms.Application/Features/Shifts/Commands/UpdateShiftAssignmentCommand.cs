using MediatR;

namespace Hrms.Application.Features.Shifts.Commands
{
    /// <summary>
    /// Command cập nhật gán shift cho employee
    /// </summary>
    public class UpdateShiftAssignmentCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Guid ShiftId { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public int? ProductionLineId { get; set; }
    }
}
