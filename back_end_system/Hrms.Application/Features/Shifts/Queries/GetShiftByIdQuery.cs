using MediatR;
using Hrms.Application.DTOs;

namespace Hrms.Application.Features.Shifts.Queries
{
    /// <summary>
    /// Query lấy Shift theo Id
    /// </summary>
    public class GetShiftByIdQuery : IRequest<ShiftDTO?>
    {
        public Guid Id { get; set; }

        public GetShiftByIdQuery(Guid id)
        {
            Id = id;
        }
    }
}
