using MediatR;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Employees.Queries;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.Employees.Queries
{
    /// <summary>
    /// Handler lấy danh sách employees
    /// </summary>
    public class GetAllEmployeesQueryHandler : IRequestHandler<GetAllEmployeesQuery, List<EmployeeDTO>>
    {
        private readonly IEmployeeRepository _employeeRepository;

        public GetAllEmployeesQueryHandler(IEmployeeRepository employeeRepository)
        {
            _employeeRepository = employeeRepository;
        }

        public async Task<List<EmployeeDTO>> Handle(GetAllEmployeesQuery request, CancellationToken cancellationToken)
        {
            IEnumerable<Employee> employees;

            // Filter theo IsActive và DepartmentId
            if (request.IsActive.HasValue && request.DepartmentId.HasValue)
            {
                var allEmployees = await _employeeRepository.GetByDepartmentIdAsync(request.DepartmentId.Value, cancellationToken);
                employees = allEmployees.Where(e => e.IsActive == request.IsActive.Value);
            }
            else if (request.IsActive.HasValue && request.IsActive.Value)
            {
                employees = await _employeeRepository.GetActiveEmployeesAsync(cancellationToken);
            }
            else if (request.DepartmentId.HasValue)
            {
                employees = await _employeeRepository.GetByDepartmentIdAsync(request.DepartmentId.Value, cancellationToken);
            }
            else
            {
                employees = await _employeeRepository.GetAllAsync(cancellationToken);
            }

            var today = DateTime.Today;

            return employees
                .OrderBy(e => e.EmployeeCode)
                .Select(e => {
                    var currentAssignment = e.ShiftAssignments
                        .Where(sa => sa.FromDate <= today && sa.ToDate >= today)
                        .OrderByDescending(sa => sa.FromDate)
                        .FirstOrDefault();

                    return new EmployeeDTO
                    {
                        Id = e.Id,
                        EmployeeCode = e.EmployeeCode,
                        FullName = e.FullName,
                        DateOfBirth = e.DateOfBirth,
                        PhoneNumber = e.PhoneNumber,
                        Email = e.Email,
                        DepartmentId = e.DepartmentId,
                        HireDate = e.HireDate,
                        IsActive = e.IsActive,
                        // Bổ sung thông tin gán
                        ProductionLineId = currentAssignment?.ProductionLineId,
                        ProductionLineName = currentAssignment?.ProductionLine?.LineName,
                        ShiftId = currentAssignment?.ShiftId,
                        ShiftName = currentAssignment?.Shift?.Name
                    };
                })
                .ToList();
        }
    }
}
