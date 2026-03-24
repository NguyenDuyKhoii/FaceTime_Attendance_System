using MediatR;
using Hrms.Application.DTOs;

namespace Hrms.Application.Features.Employees.Commands
{
    /// <summary>
    /// Command tạo mới Employee
    /// </summary>
    public class CreateEmployeeCommand : IRequest<EmployeeDTO>
    {
        public string EmployeeCode { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public DateTime DateOfBirth { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string? IdentityNumber { get; set; }
        public int? DepartmentId { get; set; }
        public DateTime HireDate { get; set; }
        public int? ProductionLineId { get; set; }
        public Guid? ShiftId { get; set; }
    }
}
