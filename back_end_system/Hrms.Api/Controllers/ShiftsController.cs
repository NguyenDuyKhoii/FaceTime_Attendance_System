using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hrms.Application.Features.Shifts.Commands;
using Hrms.Application.Features.Shifts.Queries;

namespace Hrms.Api.Controllers
{
    /// <summary>
    /// Controller quản lý Shifts và Shift Assignments
    /// Module 6: Shift & Assignment Management
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ShiftsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<ShiftsController> _logger;

        public ShiftsController(IMediator mediator, ILogger<ShiftsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Tạo mới shift
        /// POST /api/shifts
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult> CreateShift([FromBody] CreateShiftCommand command)
        {
            try
            {
                var id = await _mediator.Send(command);
                return Ok(new { id, message = "Shift created successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Gán shift cho employee
        /// POST /api/shifts/assign
        /// </summary>
        [HttpPost("assign")]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult> AssignShift([FromBody] AssignShiftToEmployeeCommand command)
        {
            try
            {
                var assignmentId = await _mediator.Send(command);
                return Ok(new { assignmentId, message = "Shift assigned successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật shift assignment
        /// PUT /api/shifts/assignments/{id}
        /// </summary>
        [HttpPut("assignments/{id}")]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult> UpdateAssignment(Guid id, [FromBody] UpdateShiftAssignmentCommand command)
        {
            if (id != command.Id)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            try
            {
                await _mediator.Send(command);
                return Ok(new { message = "Shift assignment updated successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật shift
        /// PUT /api/shifts/{id}
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult> UpdateShift(Guid id, [FromBody] UpdateShiftCommand command)
        {
            if (id != command.Id)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            try
            {
                await _mediator.Send(command);
                return Ok(new { message = "Shift updated successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Xóa shift
        /// DELETE /api/shifts/{id}
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult> DeleteShift(Guid id)
        {
            try
            {
                await _mediator.Send(new DeleteShiftCommand(id));
                return Ok(new { message = "Shift deleted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }


        /// <summary>
        /// Lấy danh sách shifts
        /// GET /api/shifts
        /// </summary>
        [HttpGet]
        public async Task<ActionResult> GetShifts()
        {
            var shifts = await _mediator.Send(new GetAllShiftsQuery());
            return Ok(shifts);
        }

        /// <summary>
        /// Lấy shift theo id
        /// GET /api/shifts/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult> GetShiftById(Guid id)
        {
            var shift = await _mediator.Send(new GetShiftByIdQuery(id));
            if (shift == null)
            {
                return NotFound(new { message = $"Shift with id {id} not found" });
            }
            return Ok(shift);
        }
        /// <summary>
        /// Lấy danh sách shift assignments
        /// GET /api/shifts/assignments
        /// </summary>
        [HttpGet("assignments")]
        public async Task<ActionResult> GetShiftAssignments()
        {
            var assignments = await _mediator.Send(new GetAllShiftAssignmentsQuery());
            return Ok(assignments);
        }
    }
}
