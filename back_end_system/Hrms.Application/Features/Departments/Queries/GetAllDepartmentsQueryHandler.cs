using MediatR;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Departments.Queries;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.Departments.Queries
{
    /// <summary>
    /// Handler lấy danh sách departments
    /// </summary>
    public class GetAllDepartmentsQueryHandler : IRequestHandler<GetAllDepartmentsQuery, List<DepartmentDTO>>
    {
        private readonly IDepartmentRepository _departmentRepository;

        public GetAllDepartmentsQueryHandler(IDepartmentRepository departmentRepository)
        {
            _departmentRepository = departmentRepository;
        }

        public async Task<List<DepartmentDTO>> Handle(GetAllDepartmentsQuery request, CancellationToken cancellationToken)
        {
            var departments = await _departmentRepository.GetAllAsync(cancellationToken);
            return departments
                .OrderBy(d => d.DepartmentCode)
                .Select(d => new DepartmentDTO
                {
                    Id = d.Id,
                    DepartmentCode = d.DepartmentCode,
                    Name = d.Name,
                    Description = d.Description
                })
                .ToList();
        }
    }
}
