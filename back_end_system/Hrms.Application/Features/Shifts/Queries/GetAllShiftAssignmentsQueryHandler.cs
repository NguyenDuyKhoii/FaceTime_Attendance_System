using MediatR;
using Hrms.Application.DTOs;
using Hrms.Application.Interface;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Hrms.Application.Features.Shifts.Queries
{
    public class GetAllShiftAssignmentsQueryHandler : IRequestHandler<GetAllShiftAssignmentsQuery, IEnumerable<ShiftAssignmentDTO>>
    {
        private readonly IShiftAssignmentRepository _shiftAssignmentRepository;

        public GetAllShiftAssignmentsQueryHandler(IShiftAssignmentRepository shiftAssignmentRepository)
        {
            _shiftAssignmentRepository = shiftAssignmentRepository;
        }

        public async Task<IEnumerable<ShiftAssignmentDTO>> Handle(GetAllShiftAssignmentsQuery request, CancellationToken cancellationToken)
        {
            // Note: IShiftAssignmentRepository implementation should use Include to fetch navigation properties
            // Based on my research, ShiftAssignmentRepository already has some Include in other methods, 
            // but GetAllAsync might not. I will rely on the repository naturally fetching them if configured or I might need to adjust Repository.
            // However, looking at ShiftAssignmentRepository.cs, it uses .Include in custom methods.
            // I'll assume GetAllAsync returns all but I might need a more specific query if Includes are missing from base GetAllAsync.
            
            // Actually, I'll use the _dbSet directly if I can, or check if I need to add a specialized method to IShiftAssignmentRepository.
            // For now, I'll use a simple implementation and if it fails to load names, I'll fix the repository.
            
            var assignments = await _shiftAssignmentRepository.GetAllWithDetailsAsync(cancellationToken);

            return assignments.Select(sa => new ShiftAssignmentDTO
            {
                Id = sa.Id,
                EmployeeId = sa.EmployeeId,
                EmployeeName = sa.Employee?.FullName ?? "Unknown",
                ShiftId = sa.ShiftId,
                ShiftName = sa.Shift?.Name ?? "Unknown",
                ProductionLineId = sa.ProductionLineId,
                ProductionLineName = sa.ProductionLine?.LineName ?? "N/A",
                FromDate = sa.FromDate,
                ToDate = sa.ToDate
            });
        }
    }
}
