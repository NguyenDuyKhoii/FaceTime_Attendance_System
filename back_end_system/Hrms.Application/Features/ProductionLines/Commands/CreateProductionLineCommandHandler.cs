using MediatR;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.ProductionLines.Commands
{
    public class CreateProductionLineCommandHandler : IRequestHandler<CreateProductionLineCommand, int>
    {
        private readonly IProductionLineRepository _productionLineRepository;

        public CreateProductionLineCommandHandler(IProductionLineRepository productionLineRepository)
        {
            _productionLineRepository = productionLineRepository;
        }

        public async Task<int> Handle(CreateProductionLineCommand request, CancellationToken cancellationToken)
        {
            var line = new ProductionLine
            {
                LineName = request.LineName,
                DepartmentId = request.DepartmentId,
                Capacity = request.Capacity,
                MachineCount = request.MachineCount,
                Status = request.Status
            };

            await _productionLineRepository.AddAsync(line, cancellationToken);
            await _productionLineRepository.SaveChangesAsync(cancellationToken);
            return line.Id;
        }
    }
}
