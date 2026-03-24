using MediatR;
using Hrms.Application.Features.Auth.Queries;
using Hrms.Application.Interface;

namespace Hrms.Application.Features.Auth.Queries
{
    /// <summary>
    /// Handler lấy danh sách tất cả roles
    /// </summary>
    public class GetAllRolesQueryHandler : IRequestHandler<GetAllRolesQuery, List<RoleDto>>
    {
        private readonly IRoleRepository _roleRepository;

        public GetAllRolesQueryHandler(IRoleRepository roleRepository)
        {
            _roleRepository = roleRepository;
        }

        public async Task<List<RoleDto>> Handle(GetAllRolesQuery request, CancellationToken cancellationToken)
        {
            var roles = await _roleRepository.GetActiveRolesAsync(cancellationToken);

            return roles.Select(r => new RoleDto
            {
                Id = r.Id,
                RoleCode = r.RoleCode,
                RoleName = r.RoleName,
                Description = r.Description,
                IsActive = r.IsActive
            }).ToList();
        }
    }
}
