using MediatR;
using Hrms.Application.DTOs;
using Hrms.Application.Interface;

namespace Hrms.Application.Features.ProductionLines.Queries
{
    public class GetAllProductionLinesQueryHandler : IRequestHandler<GetAllProductionLinesQuery, List<ProductionLineDTO>>
    {
        private readonly IProductionLineRepository _productionLineRepository;

        public GetAllProductionLinesQueryHandler(IProductionLineRepository productionLineRepository)
        {
            _productionLineRepository = productionLineRepository;
        }

        public async Task<List<ProductionLineDTO>> Handle(GetAllProductionLinesQuery request, CancellationToken cancellationToken)
        {
            var lines = await _productionLineRepository.GetAllAsync(cancellationToken);

            return lines.Select(l => new ProductionLineDTO
            {
                Id = l.Id,
                LineName = l.LineName,
                DepartmentId = l.DepartmentId,
                Status = l.Status,
                Capacity = l.Capacity,
                MachineCount = l.MachineCount,
                DepartmentName = l.Department?.Name
            }).ToList();
        }
    }
}
