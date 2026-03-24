using MediatR;

namespace Hrms.Application.Features.Departments.Commands
{
    /// <summary>
    /// Command xóa Department
    /// </summary>
    public class DeleteDepartmentCommand : IRequest<Unit>
    {
        public int Id { get; set; }
    }
}
