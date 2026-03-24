using MediatR;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Shifts.Queries;
using Hrms.Application.Interface;

namespace Hrms.Application.Features.Shifts.Queries
{
    /// <summary>
    /// Handler lấy danh sách tất cả Shift
    /// </summary>
    public class GetAllShiftsQueryHandler : IRequestHandler<GetAllShiftsQuery, IEnumerable<ShiftDTO>>
    {
        private readonly IShiftRepository _shiftRepository;

        public GetAllShiftsQueryHandler(IShiftRepository shiftRepository)
        {
            _shiftRepository = shiftRepository;
        }

        public async Task<IEnumerable<ShiftDTO>> Handle(GetAllShiftsQuery request, CancellationToken cancellationToken)
        {
            var shifts = await _shiftRepository.GetAllAsync(cancellationToken);

            return shifts.Select(shift => new ShiftDTO
            {
                Id = shift.Id,
                ShiftCode = shift.ShiftCode,
                Name = shift.Name,
                StartTime = shift.StartTime,
                EndTime = shift.EndTime,
                BreakDuration = shift.BreakDuration,
                AllowedLateMinutes = shift.AllowedLateMinutes,
                AllowedEarlyLeaveMinutes = shift.AllowedEarlyLeaveMinutes
            });
        }
    }
}
