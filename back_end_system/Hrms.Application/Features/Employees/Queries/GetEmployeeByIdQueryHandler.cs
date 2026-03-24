using MediatR;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Employees.Queries;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.Employees.Queries
{
    /// <summary>
    /// Handler lấy employee theo Id
    /// </summary>
    public class GetEmployeeByIdQueryHandler : IRequestHandler<GetEmployeeByIdQuery, EmployeeDTO?>
    {
        private readonly IEmployeeRepository _employeeRepository;

        public GetEmployeeByIdQueryHandler(IEmployeeRepository employeeRepository)
        {
            _employeeRepository = employeeRepository;
        }

        public async Task<EmployeeDTO?> Handle(GetEmployeeByIdQuery request, CancellationToken cancellationToken)
        {
            var employee = await _employeeRepository.GetByIdAsync(request.Id, cancellationToken);
            if (employee == null)
                return null;

            return new EmployeeDTO
            {
                Id = employee.Id,
                EmployeeCode = employee.EmployeeCode,
                FullName = employee.FullName,
                DateOfBirth = employee.DateOfBirth,
                PhoneNumber = employee.PhoneNumber,
                Email = employee.Email,
                DepartmentId = employee.DepartmentId,
                HireDate = employee.HireDate,
                IsActive = employee.IsActive
            };
        }
    }
}
