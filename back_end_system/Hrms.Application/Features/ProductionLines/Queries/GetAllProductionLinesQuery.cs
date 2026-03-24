using MediatR;
using Hrms.Application.DTOs;

namespace Hrms.Application.Features.ProductionLines.Queries
{
    public class GetAllProductionLinesQuery : IRequest<List<ProductionLineDTO>>
    {
    }
}
