using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Departments.Commands;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.Departments.Commands
{
    /// <summary>
    /// Handler tạo mới Department
    /// </summary>
    public class CreateDepartmentCommandHandler : IRequestHandler<CreateDepartmentCommand, DepartmentDTO>
    {
        private readonly IDepartmentRepository _departmentRepository;
        private readonly ILogger<CreateDepartmentCommandHandler> _logger;

        public CreateDepartmentCommandHandler(
            IDepartmentRepository departmentRepository,
            ILogger<CreateDepartmentCommandHandler> logger)
        {
            _departmentRepository = departmentRepository;
            _logger = logger;
        }

        public async Task<DepartmentDTO> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
        {
            var exists = await _departmentRepository.DepartmentCodeExistsAsync(request.DepartmentCode, cancellationToken);
            if (exists)
            {
                throw new InvalidOperationException($"Phòng ban với mã {request.DepartmentCode} đã tồn tại");
            }

            var department = new Department
            {
                DepartmentCode = request.DepartmentCode,
                Name = request.Name,
                Description = request.Description
            };

            await _departmentRepository.AddAsync(department, cancellationToken);
            await _departmentRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Department created: {DepartmentCode} - {Name}", department.DepartmentCode, department.Name);

            return new DepartmentDTO
            {
                Id = department.Id,
                DepartmentCode = department.DepartmentCode,
                Name = department.Name,
                Description = department.Description
            };
        }
    }
}
