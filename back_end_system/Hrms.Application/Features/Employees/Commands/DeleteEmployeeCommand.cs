using MediatR;

namespace Hrms.Application.Features.Employees.Commands
{
    /// <summary>
    /// Command xóa Employee
    /// </summary>
    public class DeleteEmployeeCommand : IRequest<Unit>
    {
        public Guid Id { get; set; }
    }
}