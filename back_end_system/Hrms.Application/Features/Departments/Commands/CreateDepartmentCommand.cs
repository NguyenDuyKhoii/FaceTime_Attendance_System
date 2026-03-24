using MediatR;
using Hrms.Application.DTOs;

namespace Hrms.Application.Features.Departments.Commands
{
    /// <summary>
    /// Command tạo mới Department
    /// </summary>
    public class CreateDepartmentCommand : IRequest<DepartmentDTO>
    {
        public string DepartmentCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
    }
}
