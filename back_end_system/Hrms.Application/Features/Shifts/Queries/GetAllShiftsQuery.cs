using MediatR;
using Hrms.Application.DTOs;

namespace Hrms.Application.Features.Shifts.Queries
{
    /// <summary>
    /// Query lấy danh sách tất cả Shift
    /// </summary>
    public class GetAllShiftsQuery : IRequest<IEnumerable<ShiftDTO>>
    {
    }
}
