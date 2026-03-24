using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hrms.Application.DTOs.Attendance;
using Hrms.Application.Features.Attendance.Commands;
using Hrms.Application.Features.Attendance.Queries;

namespace Hrms.Api.Controllers
{
    /// <summary>
    /// Controller xử lý Attendance
    /// Module 4: Attendance Processing
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        public class FaceCheckInForm
        {
            public IFormFile File { get; set; } = null!;
            public string? DeviceId { get; set; }
        }

        private readonly IMediator _mediator;
        private readonly ILogger<AttendanceController> _logger;

        public AttendanceController(IMediator mediator, ILogger<AttendanceController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }
 
        /// <summary>
        /// Xử lý face check-in/check-out từ ESP32-CAM hoặc Upload tay
        /// POST /api/attendance/face-checkin
        /// </summary>
        [HttpPost("face-checkin")]
        [AllowAnonymous]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<FaceCheckInResponseDto>> FaceCheckIn(
            [FromForm] FaceCheckInForm form)
        {
            try
            {
                if (form.File == null || form.File.Length == 0)
                {
                    return BadRequest(new { message = "Vui lòng chọn một file ảnh" });
                }

                // Chuyển file sang Base64
                using var ms = new MemoryStream();
                await form.File.CopyToAsync(ms);
                var imageBase64 = Convert.ToBase64String(ms.ToArray());

                var command = new FaceCheckInCommand
                {
                    DeviceId = form.DeviceId ?? "Manual-Upload",
                    ImageBase64 = imageBase64,
                    CapturedAt = DateTime.UtcNow
                };

                var result = await _mediator.Send(command);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during manual face check-in");
                return Ok(new FaceCheckInResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xử lý check-in",
                    Status = "Error"
                });
            }
        }

        /// <summary>
        /// Lấy lịch sử chấm công với phân trang và bộ lọc
        /// GET /api/attendance
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<AttendanceHistoryListDto>> GetAttendanceHistory(
            [FromQuery] Guid? employeeId,
            [FromQuery] int? departmentId,
            [FromQuery] int? productionLineId,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(roleClaim))
                {
                    return Unauthorized(new { message = "Unauthorized access" });
                }

                var query = new GetAttendanceHistoryQuery
                {
                    EmployeeId = employeeId,
                    DepartmentId = departmentId,
                    ProductionLineId = productionLineId,
                    FromDate = fromDate,
                    ToDate = toDate,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    CurrentUserId = Guid.Parse(userIdClaim),
                    CurrentUserRole = roleClaim
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting attendance history");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy lịch sử chấm công" });
            }
        }

        /// <summary>
        /// Lấy chi tiết một bản ghi chấm công
        /// GET /api/attendance/{id}
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<AttendanceDetailDto>> GetAttendanceDetail(Guid id)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(roleClaim))
                {
                    return Unauthorized(new { message = "Unauthorized access" });
                }

                var query = new GetAttendanceDetailQuery
                {
                    Id = id,
                    CurrentUserId = Guid.Parse(userIdClaim),
                    CurrentUserRole = roleClaim
                };

                var result = await _mediator.Send(query);
                if (result == null) return NotFound(new { message = "Không tìm thấy bản ghi chấm công" });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting attendance detail");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy chi tiết chấm công" });
            }
        }

        /// <summary>
        /// Cập nhật bản ghi chấm công (Dành cho HR/Admin)
        /// PUT /api/attendance/{id}
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult> UpdateAttendance(Guid id, [FromBody] UpdateAttendanceCommand command)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new { message = "Unauthorized access" });
                }

                command.Id = id;
                command.CurrentUserId = Guid.Parse(userIdClaim);

                var result = await _mediator.Send(command);
                if (!result) return NotFound(new { message = "Không cập nhật được bản ghi chấm công" });

                return Ok(new { message = "Cập nhật thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating attendance");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật chấm công" });
            }
        }
    }
}
