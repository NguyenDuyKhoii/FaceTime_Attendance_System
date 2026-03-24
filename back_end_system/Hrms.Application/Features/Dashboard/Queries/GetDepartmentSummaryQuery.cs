using MediatR;
using Hrms.Application.DTOs.Dashboard;

namespace Hrms.Application.Features.Dashboard.Queries
{
    public class GetDepartmentSummaryQuery : IRequest<IEnumerable<DepartmentSummaryDto>>
    {
        public Guid CurrentUserId { get; set; }
        public string CurrentUserRole { get; set; } = null!;
    }
}
