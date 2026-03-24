using MediatR;
using Microsoft.Extensions.Logging;
using Hrms.Application.Interface;

namespace Hrms.Application.Features.Shifts.Commands
{
    public class UpdateShiftAssignmentCommandHandler : IRequestHandler<UpdateShiftAssignmentCommand, bool>
    {
        private readonly IShiftAssignmentRepository _shiftAssignmentRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IShiftRepository _shiftRepository;
        private readonly ILogger<UpdateShiftAssignmentCommandHandler> _logger;

        public UpdateShiftAssignmentCommandHandler(
            IShiftAssignmentRepository shiftAssignmentRepository,
            IEmployeeRepository employeeRepository,
            IShiftRepository shiftRepository,
            ILogger<UpdateShiftAssignmentCommandHandler> logger)
        {
            _shiftAssignmentRepository = shiftAssignmentRepository;
            _employeeRepository = employeeRepository;
            _shiftRepository = shiftRepository;
            _logger = logger;
        }

        public async Task<bool> Handle(UpdateShiftAssignmentCommand request, CancellationToken cancellationToken)
        {
            var assignment = await _shiftAssignmentRepository.GetByIdAsync(request.Id, cancellationToken);
            if (assignment == null)
            {
                throw new KeyNotFoundException($"ShiftAssignment với ID {request.Id} không tồn tại");
            }

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

            // Kiểm tra overlap (trừ chính nó)
            var hasOverlap = await _shiftAssignmentRepository.HasOverlappingAssignmentAsync(
                request.EmployeeId, request.FromDate, request.ToDate, request.Id, cancellationToken);

            if (hasOverlap)
            {
                throw new InvalidOperationException("Khoảng thời gian này bị trùng lặp với một phân ca khác của nhân viên này.");
            }

            assignment.EmployeeId = request.EmployeeId;
            assignment.ShiftId = request.ShiftId;
            assignment.FromDate = request.FromDate;
            assignment.ToDate = request.ToDate;
            assignment.ProductionLineId = request.ProductionLineId;

            _shiftAssignmentRepository.Update(assignment);
            await _shiftAssignmentRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Shift assignment updated: ID={AssignmentId}", assignment.Id);

            return true;
        }
    }
}
