using MediatR;
using Hrms.Application.DTOs;
using System.Collections.Generic;

namespace Hrms.Application.Features.Shifts.Queries
{
    public class GetAllShiftAssignmentsQuery : IRequest<IEnumerable<ShiftAssignmentDTO>>
    {
    }
}
