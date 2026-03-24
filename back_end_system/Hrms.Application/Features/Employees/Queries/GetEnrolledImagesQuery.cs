using MediatR;
using Hrms.Application.DTOs.PythonAI;

namespace Hrms.Application.Features.Employees.Queries
{
    public class GetEnrolledImagesQuery : IRequest<PythonGetImagesResponseDto>
    {
        public Guid EmployeeId { get; set; }
    }
}
