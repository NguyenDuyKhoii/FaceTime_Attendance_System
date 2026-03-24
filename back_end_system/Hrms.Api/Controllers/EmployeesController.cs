using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Employees.Commands;
using Hrms.Application.Features.Employees.Queries;
using Hrms.Application.DTOs.PythonAI;
using Hrms.Application.DTOs.Employee;

namespace Hrms.Api.Controllers
{
    /// <summary>
    /// Controller quản lý Employees
    /// Module 2: Employee Management
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmployeesController : ControllerBase
    {
        public class EnrollFaceForm
        {
            public IFormFile File { get; set; } = null!;
        }

        private readonly IMediator _mediator;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(IMediator mediator, ILogger<EmployeesController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tất cả employees
        /// GET /api/employees
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<EmployeeDTO>>> GetAllEmployees(
            [FromQuery] bool? isActive = null,
            [FromQuery] int? departmentId = null)
        {
            var query = new GetAllEmployeesQuery
            {
                IsActive = isActive,
                DepartmentId = departmentId
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }
        /// <summary>
        /// Lấy employee theo id
        /// GET /api/employees/{id}
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<EmployeeDTO>> GetEmployeeById(Guid id)
        {
            var result = await _mediator.Send(new GetEmployeeByIdQuery { Id = id });
            if (result == null)
                return NotFound(new { message = $"Không tìm thấy employee với Id = {id}" });
            return Ok(result);
        }
        /// <summary>
        /// Tạo mới employee
        /// POST /api/employees
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult<EmployeeDTO>> CreateEmployee([FromBody] CreateEmployeeCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return CreatedAtAction(nameof(GetAllEmployees), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        /// <summary>
        /// Cập nhật employee
        /// PUT /api/employees/{id}
        /// </summary>
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult<EmployeeDTO>> UpdateEmployee(
            Guid id,
            [FromBody] UpdateEmployeeCommand command)
        {
            command.SetId(id);
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
        /// Xóa employee
        /// DELETE /api/employees/{id}
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult> DeleteEmployee(Guid id)
        {
            try
            {
                await _mediator.Send(new DeleteEmployeeCommand { Id = id });
                return NoContent();
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
        /// Enroll (đăng ký) khuôn mặt nhân viên vào Python AI Service
        /// POST /api/employees/{id}/enroll-face
        /// </summary>
        [HttpPost("{id}/enroll-face")]
        [Authorize(Roles = "Admin,HR,Administrator")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<EnrollEmployeeFaceResponseDto>> EnrollFace(
            Guid id, 
            [FromForm] EnrollFaceForm form)
        {
            try
            {
                if (form.File == null || form.File.Length == 0)
                {
                    return BadRequest(new { message = "Vui lòng chọn một file ảnh" });
                }

                // Chuyển file stream sang Base64 để gửi vào Command (hoặc pass stream)
                using var ms = new MemoryStream();
                await form.File.CopyToAsync(ms);
                var fileBytes = ms.ToArray();
                var imageBase64 = Convert.ToBase64String(fileBytes);

                var command = new EnrollEmployeeFaceCommand
                {
                    EmployeeId = id,
                    ImageBase64 = imageBase64
                };

                var result = await _mediator.Send(command);
                
                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enrolling face for employee: {EmployeeId}", id);
                return StatusCode(500, new EnrollEmployeeFaceResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi đăng ký khuôn mặt"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách ảnh đã enroll của nhân viên
        /// GET /api/employees/{id}/images
        /// </summary>
        [HttpGet("{id}/images")]
        public async Task<ActionResult<PythonGetImagesResponseDto>> GetEnrolledImages(Guid id)
        {
            var query = new GetEnrolledImagesQuery { EmployeeId = id };
            var result = await _mediator.Send(query);
            return Ok(result);
        }
    }

    /// <summary>
    /// Request DTO cho enroll face
    /// </summary>
    public class EnrollFaceRequestDto
    {
        public string ImageBase64 { get; set; } = string.Empty;
    }
}
