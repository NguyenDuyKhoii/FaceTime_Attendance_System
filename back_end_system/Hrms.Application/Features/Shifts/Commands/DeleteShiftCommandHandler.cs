using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.Interface;

namespace Hrms.Application.Features.Shifts.Commands
{
    /// <summary>
    /// Handler xóa Shift
    /// </summary>
    public class DeleteShiftCommandHandler : IRequestHandler<DeleteShiftCommand, Unit>
    {
        private readonly IShiftRepository _shiftRepository;
        private readonly ILogger<DeleteShiftCommandHandler> _logger;

        public DeleteShiftCommandHandler(IShiftRepository shiftRepository, ILogger<DeleteShiftCommandHandler> logger)
        {
            _shiftRepository = shiftRepository;
            _logger = logger;
        }

        public async Task<Unit> Handle(DeleteShiftCommand request, CancellationToken cancellationToken)
        {
            var shift = await _shiftRepository.GetByIdAsync(request.Id, cancellationToken);
            if (shift == null)
            {
                throw new KeyNotFoundException($"Shift with id {request.Id} not found");
            }

            // Check if shift can be deleted (e.g. valid unused constraints). 
            // Currently assuming direct delete is allowed or DB FK constraints will handle it.
            // But if there are associated records, it might fail. 
            // Logic: Just remove.

            _shiftRepository.Remove(shift);
            await _shiftRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Shift deleted: {Id}", request.Id);

            return Unit.Value;
        }
    }
}
