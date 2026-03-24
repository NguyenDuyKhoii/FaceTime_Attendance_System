using MediatR;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Shifts.Queries;
using Hrms.Application.Interface;

namespace Hrms.Application.Features.Shifts.Queries
{
    /// <summary>
    /// Handler lấy Shift theo Id
    /// </summary>
    public class GetShiftByIdQueryHandler : IRequestHandler<GetShiftByIdQuery, ShiftDTO?>
    {
        private readonly IShiftRepository _shiftRepository;

        public GetShiftByIdQueryHandler(IShiftRepository shiftRepository)
        {
            _shiftRepository = shiftRepository;
        }

        public async Task<ShiftDTO?> Handle(GetShiftByIdQuery request, CancellationToken cancellationToken)
        {
            var shift = await _shiftRepository.GetByIdAsync(request.Id, cancellationToken);
            if (shift == null)
            {
                return null;
            }

            return new ShiftDTO
            {
                Id = shift.Id,
                ShiftCode = shift.ShiftCode,
                Name = shift.Name,
                StartTime = shift.StartTime,
                EndTime = shift.EndTime,
                BreakDuration = shift.BreakDuration,
                AllowedLateMinutes = shift.AllowedLateMinutes,
                AllowedEarlyLeaveMinutes = shift.AllowedEarlyLeaveMinutes
            };
        }
    }
}
