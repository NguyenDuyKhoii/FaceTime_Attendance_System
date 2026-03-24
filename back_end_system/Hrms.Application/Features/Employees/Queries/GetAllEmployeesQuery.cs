using MediatR;
using Hrms.Application.DTOs;

namespace Hrms.Application.Features.Employees.Queries
{
    /// <summary>
    /// Query lấy danh sách tất cả employees
    /// </summary>
    public class GetAllEmployeesQuery : IRequest<List<EmployeeDTO>>
    {
        public bool? IsActive { get; set; }
        public int? DepartmentId { get; set; }
    }
}
