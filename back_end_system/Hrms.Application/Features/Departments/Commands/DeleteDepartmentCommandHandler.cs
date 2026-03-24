using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.Features.Departments.Commands;
using Hrms.Application.Interface;

namespace Hrms.Application.Features.Departments.Commands
{
    /// <summary>
    /// Handler xóa Department
    /// </summary>
    public class DeleteDepartmentCommandHandler : IRequestHandler<DeleteDepartmentCommand, Unit>
    {
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ILogger<DeleteDepartmentCommandHandler> _logger;

        public DeleteDepartmentCommandHandler(
            IDepartmentRepository departmentRepository,
            IEmployeeRepository employeeRepository,
            ILogger<DeleteDepartmentCommandHandler> logger)
        {
            _departmentRepository = departmentRepository;
            _employeeRepository = employeeRepository;
            _logger = logger;
        }

        public async Task<Unit> Handle(DeleteDepartmentCommand request, CancellationToken cancellationToken)
        {
            var department = await _departmentRepository.GetByIdAsync(request.Id, cancellationToken);
            if (department == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy phòng ban với Id = {request.Id}");
            }

            var employeesInDepartment = await _employeeRepository.GetByDepartmentIdAsync(request.Id, cancellationToken);
            if (employeesInDepartment.Any())
            {
                throw new InvalidOperationException("Không thể xóa phòng ban đang có nhân viên. Vui lòng chuyển hoặc xóa nhân viên trước.");
            }

            _departmentRepository.Remove(department);
            await _departmentRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Department deleted: Id={Id}, {DepartmentCode}", department.Id, department.DepartmentCode);

            return Unit.Value;
        }
    }
}
