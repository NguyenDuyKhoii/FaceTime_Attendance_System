using MediatR;
using Hrms.Application.DTOs.PythonAI;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.Employees.Queries
{
    public class GetEnrolledImagesQueryHandler : IRequestHandler<GetEnrolledImagesQuery, PythonGetImagesResponseDto>
    {
        private readonly IPythonAIService _pythonInfoService;
        private readonly IEmployeeRepository _employeeRepository;

        public GetEnrolledImagesQueryHandler(IPythonAIService pythonInfoService, IEmployeeRepository employeeRepository)
        {
            _pythonInfoService = pythonInfoService;
            _employeeRepository = employeeRepository;
        }

        public async Task<PythonGetImagesResponseDto> Handle(GetEnrolledImagesQuery request, CancellationToken cancellationToken)
        {
            // 1. Get EmployeeCode from EmployeeId
            var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId, cancellationToken);
            if (employee == null)
            {
                return new PythonGetImagesResponseDto { Ok = false };
            }

            // 2. Call Python Service with EmployeeCode
            return await _pythonInfoService.GetEnrolledImagesAsync(employee.EmployeeCode, cancellationToken);
        }
    }
}
