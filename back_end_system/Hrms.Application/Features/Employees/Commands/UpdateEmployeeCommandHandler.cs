using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Employees.Commands;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.Employees.Commands
{
    /// <summary>
    /// Handler cập nhật Employee
    /// </summary>
    public class UpdateEmployeeCommandHandler : IRequestHandler<UpdateEmployeeCommand, EmployeeDTO>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdateEmployeeCommandHandler> _logger;

        public UpdateEmployeeCommandHandler(
            IEmployeeRepository employeeRepository,
            IMapper mapper,
            ILogger<UpdateEmployeeCommandHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<EmployeeDTO> Handle(UpdateEmployeeCommand request, CancellationToken cancellationToken)
        {
            var employee = await _employeeRepository.GetByIdAsync(request.Id, cancellationToken);
            if (employee == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy employee với Id = {request.Id}");
            }

            // Nếu đổi mã nhân viên thì kiểm tra trùng
            if (employee.EmployeeCode != request.EmployeeCode)
            {
                var codeExists = await _employeeRepository.EmployeeCodeExistsAsync(request.EmployeeCode, cancellationToken);
                if (codeExists)
                {
                    throw new InvalidOperationException($"Mã nhân viên {request.EmployeeCode} đã tồn tại");
                }
            }

            _mapper.Map(request, employee);
            employee.UpdatedAt = DateTime.UtcNow;
            await _employeeRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Employee updated: {EmployeeCode} - {FullName}", employee.EmployeeCode, employee.FullName);

            return _mapper.Map<EmployeeDTO>(employee);
        }
    }
}
