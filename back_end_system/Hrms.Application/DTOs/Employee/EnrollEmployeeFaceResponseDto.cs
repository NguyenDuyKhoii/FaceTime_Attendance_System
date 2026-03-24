using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hrms.Application.DTOs.Employee
{
    /// <summary>
    /// Response DTO cho enrollment
    /// </summary>
    public class EnrollEmployeeFaceResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? EmployeeCode { get; set; }
        public string? EmployeeName { get; set; }
        public int? Label { get; set; }
    }
}
