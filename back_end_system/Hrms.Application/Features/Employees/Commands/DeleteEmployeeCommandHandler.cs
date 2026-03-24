using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.Features.Employees.Commands;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.Employees.Commands
{
    /// <summary>
    /// Handler xóa Employee
    /// </summary>
    public class DeleteEmployeeCommandHandler : IRequestHandler<DeleteEmployeeCommand, Unit>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ILogger<DeleteEmployeeCommandHandler> _logger;

        public DeleteEmployeeCommandHandler(
            IEmployeeRepository employeeRepository,
            ILogger<DeleteEmployeeCommandHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _logger = logger;
        }

        public async Task<Unit> Handle(DeleteEmployeeCommand request, CancellationToken cancellationToken)
        {
            var employee = await _employeeRepository.GetByIdAsync(request.Id, cancellationToken);
            if (employee == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy employee với Id = {request.Id}");
            }   

            // Kiểm tra nếu employee có ca làm việc được gán
            if (employee.ShiftAssignments.Any())
            {
                throw new InvalidOperationException("Không thể xóa employee đang có ca làm việc được gán. Vui lòng xóa ca làm việc trước.");
            }

            // Kiểm tra nếu employee có điểm danh
            if (employee.AttendanceRecords.Any())
            {
                throw new InvalidOperationException("Không thể xóa employee đang có điểm danh. Vui lòng xóa điểm danh trước.");
            }

            _employeeRepository.Remove(employee);
            await _employeeRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Employee deleted: Id={Id}, {EmployeeCode}", employee.Id, employee.EmployeeCode);

            return Unit.Value;
        }
    }
}