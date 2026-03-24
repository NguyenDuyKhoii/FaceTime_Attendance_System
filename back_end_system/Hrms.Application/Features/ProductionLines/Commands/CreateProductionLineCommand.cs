using MediatR;

namespace Hrms.Application.Features.ProductionLines.Commands
{
    public class CreateProductionLineCommand : IRequest<int>
    {
        public string LineName { get; set; } = null!;
        public int DepartmentId { get; set; }
        public int? Capacity { get; set; }
        public int? MachineCount { get; set; }
        public string Status { get; set; } = "Active";
    }
}
