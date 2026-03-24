using MediatR;
using Hrms.Application.DTOs;

namespace Hrms.Application.Features.Employees.Commands
{
    /// <summary>
    /// Command cập nhật Employee
    /// </summary>
    public class UpdateEmployeeCommand : IRequest<EmployeeDTO>
{
    public Guid Id { get; private set; }   // không cho bind từ body

    public string EmployeeCode { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public DateTime DateOfBirth { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public int? DepartmentId { get; set; }
    public DateTime HireDate { get; set; }
    public bool IsActive { get; set; } = true;

    public void SetId(Guid id)
    {
        Id = id;
    }
}

}