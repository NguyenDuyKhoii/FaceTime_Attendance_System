using MediatR;

namespace Hrms.Application.Features.Shifts.Commands
{
    /// <summary>
    /// Command xóa Shift
    /// </summary>
    public class DeleteShiftCommand : IRequest<Unit>
    {
        public Guid Id { get; set; }

        public DeleteShiftCommand(Guid id)
        {
            Id = id;
        }
    }
}
