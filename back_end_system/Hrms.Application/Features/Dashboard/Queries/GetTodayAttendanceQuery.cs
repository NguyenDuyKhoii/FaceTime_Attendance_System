using MediatR;
using Hrms.Application.DTOs.Dashboard;

namespace Hrms.Application.Features.Dashboard.Queries
{
    public class GetTodayAttendanceQuery : IRequest<TodayAttendanceDto>
    {
    }
}
