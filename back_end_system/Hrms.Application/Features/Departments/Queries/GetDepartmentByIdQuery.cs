using MediatR;
using Hrms.Application.DTOs;

namespace Hrms.Application.Features.Departments.Queries
{
    /// <summary>
    /// Query lấy department theo Id
    /// </summary>
    public class GetDepartmentByIdQuery : IRequest<DepartmentDTO?>
    {
        public int Id { get; set; }
    }
}
