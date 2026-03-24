using MediatR;
using Hrms.Application.DTOs;

namespace Hrms.Application.Features.Departments.Queries
{
    /// <summary>
    /// Query lấy danh sách tất cả departments
    /// </summary>
    public class GetAllDepartmentsQuery : IRequest<List<DepartmentDTO>>
    {
    }
}
