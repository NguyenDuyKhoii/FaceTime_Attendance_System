using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Departments.Commands;
using Hrms.Application.Features.Departments.Queries;

namespace Hrms.Api.Controllers
{
    /// <summary>
    /// Controller quản lý Departments (Phòng ban)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DepartmentsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<DepartmentsController> _logger;

        public DepartmentsController(IMediator mediator, ILogger<DepartmentsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tất cả phòng ban
        /// GET /api/departments
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<DepartmentDTO>>> GetAllDepartments()
        {
            var result = await _mediator.Send(new GetAllDepartmentsQuery());
            return Ok(result);
        }

        /// <summary>
        /// Lấy phòng ban theo Id
        /// GET /api/departments/{id}
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<ActionResult<DepartmentDTO>> GetDepartmentById(int id)
        {
            var result = await _mediator.Send(new GetDepartmentByIdQuery { Id = id });
            if (result == null)
                return NotFound(new { message = $"Không tìm thấy phòng ban với Id = {id}" });
            return Ok(result);
        }

        /// <summary>
        /// Tạo mới phòng ban
        /// POST /api/departments
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult<DepartmentDTO>> CreateDepartment([FromBody] CreateDepartmentCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return CreatedAtAction(nameof(GetDepartmentById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật phòng ban
        /// PUT /api/departments/{id}
        /// </summary>
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult<DepartmentDTO>> UpdateDepartment(int id, [FromBody] UpdateDepartmentCommand command)
        {
            if (id != command.Id)
                return BadRequest(new { message = "Id trong URL không khớp với Id trong body" });
            try
            {
                var result = await _mediator.Send(command);
                return Ok(result);
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
        /// Xóa phòng ban
        /// DELETE /api/departments/{id}
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult> DeleteDepartment(int id)
        {
            try
            {
                await _mediator.Send(new DeleteDepartmentCommand { Id = id });
                return Ok(new { message = "Đã xóa phòng ban thành công" });
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
    }
}
