using MediatR;
using Hrms.Application.DTOs;

namespace Hrms.Application.Features.Employees.Queries
{
    /// <summary>
    /// Query lấy employee theo Id
    /// </summary>
    public class GetEmployeeByIdQuery : IRequest<EmployeeDTO?>
    {
        public Guid Id { get; set; }
    }
}