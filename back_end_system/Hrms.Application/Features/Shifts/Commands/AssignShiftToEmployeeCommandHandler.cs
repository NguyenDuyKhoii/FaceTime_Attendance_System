using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.Features.Shifts.Commands;
using Hrms.Application.Interface;
using Hrms.Domain.Entities;

namespace Hrms.Application.Features.Shifts.Commands
{
    /// <summary>
    /// Handler gán shift cho employee
    /// </summary>
    public class AssignShiftToEmployeeCommandHandler : IRequestHandler<AssignShiftToEmployeeCommand, Guid>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IShiftRepository _shiftRepository;
        private readonly IShiftAssignmentRepository _shiftAssignmentRepository;
        private readonly ILogger<AssignShiftToEmployeeCommandHandler> _logger;

        public AssignShiftToEmployeeCommandHandler(
            IEmployeeRepository employeeRepository,
            IShiftRepository shiftRepository,
            IShiftAssignmentRepository shiftAssignmentRepository,
            ILogger<AssignShiftToEmployeeCommandHandler> logger)
        {
            _employeeRepository = employeeRepository;
            _shiftRepository = shiftRepository;
            _shiftAssignmentRepository = shiftAssignmentRepository;
            _logger = logger;
        }

        public async Task<Guid> Handle(AssignShiftToEmployeeCommand request, CancellationToken cancellationToken)
        {
            // Kiểm tra employee tồn tại
            var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId, cancellationToken);

            if (employee == null)
            {
                throw new KeyNotFoundException($"Employee với ID {request.EmployeeId} không tồn tại");
            }

            // Kiểm tra shift tồn tại
            var shift = await _shiftRepository.GetByIdAsync(request.ShiftId, cancellationToken);

            if (shift == null)
            {
                throw new KeyNotFoundException($"Shift với ID {request.ShiftId} không tồn tại");
            }

            // Kiểm tra overlap với shift assignment hiện tại
            var hasOverlap = await _shiftAssignmentRepository.HasOverlappingAssignmentAsync(
                request.EmployeeId, request.FromDate, request.ToDate, cancellationToken);

            if (hasOverlap)
            {
                var overlappingAssignments = await _shiftAssignmentRepository.GetByEmployeeAndDateRangeAsync(
                    request.EmployeeId, request.FromDate, request.ToDate, cancellationToken);
                var overlapping = overlappingAssignments.FirstOrDefault();
                
                throw new InvalidOperationException(
                    $"Employee đã được gán shift trong khoảng thời gian này. " +
                    $"Từ {overlapping?.FromDate:yyyy-MM-dd} đến {overlapping?.ToDate:yyyy-MM-dd}");
            }

            var assignment = new ShiftAssignment
            {
                Id = Guid.NewGuid(),
                EmployeeId = request.EmployeeId,
                ShiftId = request.ShiftId,
                FromDate = request.FromDate,
                ToDate = request.ToDate,
                ProductionLineId = request.ProductionLineId
            };

            await _shiftAssignmentRepository.AddAsync(assignment, cancellationToken);
            await _shiftAssignmentRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Shift assigned to employee: EmployeeId={EmployeeId}, ShiftId={ShiftId}, From={FromDate}, To={ToDate}",
                request.EmployeeId, request.ShiftId, request.FromDate, request.ToDate);

            return assignment.Id;
        }
    }
}
