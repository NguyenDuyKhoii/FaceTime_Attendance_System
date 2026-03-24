namespace Hrms.Application.DTOs
{
    public class EmployeeDTO
    {
        public Guid Id { get; set; }
        public string EmployeeCode { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public DateTime DateOfBirth { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }

        public int? DepartmentId { get; set; }
        public DateTime HireDate { get; set; }
        public bool IsActive { get; set; } = true;

        // Bổ sung thông tin gán hiện tại
        public string? ProductionLineName { get; set; }
        public string? ShiftName { get; set; }
        public int? ProductionLineId { get; set; }
        public Guid? ShiftId { get; set; }
    }
}
