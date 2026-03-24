using Hrms.Application.Features.Shifts.Commands;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

namespace Hrms.Application.Features.Shifts.Commands
{
    /// <summary>
    /// Handler tạo mới Shift
    /// </summary>
    public class CreateShiftCommandHandler : IRequestHandler<CreateShiftCommand, Guid>
    {
        private readonly IShiftRepository _shiftRepository;
        private readonly ILogger<CreateShiftCommandHandler> _logger;

        public CreateShiftCommandHandler(IShiftRepository shiftRepository, ILogger<CreateShiftCommandHandler> logger)
        {
            _shiftRepository = shiftRepository;
            _logger = logger;
        }

        public async Task<Guid> Handle(CreateShiftCommand request, CancellationToken cancellationToken)
        {
            // Kiểm tra ShiftCode đã tồn tại chưa
            var exists = await _shiftRepository.ShiftCodeExistsAsync(request.ShiftCode, cancellationToken);

            if (exists)
            {
                throw new InvalidOperationException($"Shift với mã {request.ShiftCode} đã tồn tại");
            }
            // 2️⃣ Parse time values
            if (!TimeSpan.TryParse(request.StartTime, out var startTime))
                throw new InvalidOperationException("Invalid StartTime format (HH:mm)");

            if (!TimeSpan.TryParse(request.EndTime, out var endTime))
                throw new InvalidOperationException("Invalid EndTime format (HH:mm)");

            TimeSpan? breakDuration = null;
            if (!string.IsNullOrWhiteSpace(request.BreakDuration))
            {
                if (!TimeSpan.TryParse(request.BreakDuration, out var bd))
                    throw new InvalidOperationException("Invalid BreakDuration format (HH:mm)");
                breakDuration = bd;
            }

            // 3️ Business rule
            if (endTime <= startTime)
                throw new InvalidOperationException("EndTime must be greater than StartTime");

            // 4️ Create entity
            var shift = new Shift
            {
                Id = Guid.NewGuid(),
                ShiftCode = request.ShiftCode.Trim(),
                Name = request.Name.Trim(),
                StartTime = startTime,
                EndTime = endTime,
                BreakDuration = breakDuration,
                AllowedLateMinutes = request.AllowedLateMinutes,
                AllowedEarlyLeaveMinutes = request.AllowedEarlyLeaveMinutes,
            };

            await _shiftRepository.AddAsync(shift, cancellationToken);
            await _shiftRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Shift created: {ShiftCode} - {Name}", shift.ShiftCode, shift.Name);

            return shift.Id;
        }
    }
}
