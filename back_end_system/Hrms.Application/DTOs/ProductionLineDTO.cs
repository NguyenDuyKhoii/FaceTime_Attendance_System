namespace Hrms.Application.DTOs
{
    public class ProductionLineDTO
    {
        public int Id { get; set; }
        public string LineName { get; set; } = null!;
        public int DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public int? Capacity { get; set; }
        public int? MachineCount { get; set; }
        public string Status { get; set; } = "Active";
    }
}
