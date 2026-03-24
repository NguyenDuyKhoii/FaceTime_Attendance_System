using MediatR;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Departments.Queries;
using Hrms.Application.Interface;

namespace Hrms.Application.Features.Departments.Queries
{
    /// <summary>
    /// Handler lấy department theo Id
    /// </summary>
    public class GetDepartmentByIdQueryHandler : IRequestHandler<GetDepartmentByIdQuery, DepartmentDTO?>
    {
        private readonly IDepartmentRepository _departmentRepository;

        public GetDepartmentByIdQueryHandler(IDepartmentRepository departmentRepository)
        {
            _departmentRepository = departmentRepository;
        }

        public async Task<DepartmentDTO?> Handle(GetDepartmentByIdQuery request, CancellationToken cancellationToken)
        {
            var department = await _departmentRepository.GetByIdAsync(request.Id, cancellationToken);
            if (department == null)
                return null;

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
