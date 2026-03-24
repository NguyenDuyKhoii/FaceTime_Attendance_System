using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Departments.Commands;
using Hrms.Application.Interface;

namespace Hrms.Application.Features.Departments.Commands
{
    /// <summary>
    /// Handler cập nhật Department
    /// </summary>
    public class UpdateDepartmentCommandHandler : IRequestHandler<UpdateDepartmentCommand, DepartmentDTO>
    {
        private readonly IDepartmentRepository _departmentRepository;
        private readonly ILogger<UpdateDepartmentCommandHandler> _logger;

        public UpdateDepartmentCommandHandler(
            IDepartmentRepository departmentRepository,
            ILogger<UpdateDepartmentCommandHandler> logger)
        {
            _departmentRepository = departmentRepository;
            _logger = logger;
        }

        public async Task<DepartmentDTO> Handle(UpdateDepartmentCommand request, CancellationToken cancellationToken)
        {
            var department = await _departmentRepository.GetByIdAsync(request.Id, cancellationToken);
            if (department == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy phòng ban với Id = {request.Id}");
            }

            // Nếu đổi mã phòng ban thì kiểm tra trùng
            if (department.DepartmentCode != request.DepartmentCode)
            {
                var codeExists = await _departmentRepository.DepartmentCodeExistsAsync(request.DepartmentCode, cancellationToken);
                if (codeExists)
                {
                    throw new InvalidOperationException($"Phòng ban với mã {request.DepartmentCode} đã tồn tại");
                }
            }

            department.DepartmentCode = request.DepartmentCode;
            department.Name = request.Name;
            department.Description = request.Description;

            _departmentRepository.Update(department);
            await _departmentRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Department updated: Id={Id}, {DepartmentCode} - {Name}", department.Id, department.DepartmentCode, department.Name);

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
