using Hrms.Application.Interface;

namespace Hrms.Application.Features.Reports.Common
{
    internal static class ReportScopeHelper
    {
        public static async Task<HashSet<int>> ResolveAllowedDepartmentsAsync(
            IManagementRepository managementRepository,
            Guid requestUserId,
            DateTime effectiveDate,
            CancellationToken cancellationToken)
        {
            var assignments = await managementRepository.GetByUserIdAsync(requestUserId, cancellationToken);

            return assignments
                .Where(m => m.IsActive && m.FromDate <= effectiveDate && m.ToDate >= effectiveDate)
                .Select(m => m.DepartmentId)
                .ToHashSet();
        }
    }
}
