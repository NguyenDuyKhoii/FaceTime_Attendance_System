using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.Interface;

namespace Hrms.Application.Features.Shifts.Commands
{
    /// <summary>
    /// Handler cập nhật Shift
    /// </summary>
    public class UpdateShiftCommandHandler : IRequestHandler<UpdateShiftCommand, Unit>
    {
        private readonly IShiftRepository _shiftRepository;
        private readonly ILogger<UpdateShiftCommandHandler> _logger;

        public UpdateShiftCommandHandler(IShiftRepository shiftRepository, ILogger<UpdateShiftCommandHandler> logger)
        {
            _shiftRepository = shiftRepository;
            _logger = logger;
        }

        public async Task<Unit> Handle(UpdateShiftCommand request, CancellationToken cancellationToken)
        {
            var shift = await _shiftRepository.GetByIdAsync(request.Id, cancellationToken);
            if (shift == null)
            {
                throw new KeyNotFoundException($"Shift with id {request.Id} not found");
            }

            // Nếu đổi ShiftCode, kiểm tra có trùng với Shift khác không
            if (shift.ShiftCode != request.ShiftCode)
            {
                var exists = await _shiftRepository.ShiftCodeExistsAsync(request.ShiftCode, cancellationToken);
                if (exists)
                {
                    throw new InvalidOperationException($"Shift với mã {request.ShiftCode} đã tồn tại");
                }
            }

            shift.ShiftCode = request.ShiftCode;
            shift.Name = request.Name;
            
            if (TimeSpan.TryParse(request.StartTime, out TimeSpan startTime))
                shift.StartTime = startTime;
            else
                throw new ArgumentException("Invalid StartTime format");

            if (TimeSpan.TryParse(request.EndTime, out TimeSpan endTime))
                shift.EndTime = endTime;
            else
                throw new ArgumentException("Invalid EndTime format");

            if (!string.IsNullOrEmpty(request.BreakDuration))
            {
                if (TimeSpan.TryParse(request.BreakDuration, out TimeSpan breakDuration))
                    shift.BreakDuration = breakDuration;
                else
                    throw new ArgumentException("Invalid BreakDuration format");
            }
            else
            {
                shift.BreakDuration = null;
            }

            shift.AllowedLateMinutes = request.AllowedLateMinutes;
            shift.AllowedEarlyLeaveMinutes = request.AllowedEarlyLeaveMinutes;

            _shiftRepository.Update(shift);
            await _shiftRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Shift updated: {ShiftCode} - {Name}", shift.ShiftCode, shift.Name);

            return Unit.Value;
        }
    }
}
