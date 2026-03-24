using System.Security.Claims;
using Hrms.Application.DTOs.Reports;
using Hrms.Application.Features.Reports.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,HR,Administrator,Manager")]
    public class ReportsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ReportsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("monthly-attendance")]
        public async Task<ActionResult<List<MonthlyAttendanceReportItemDto>>> GetMonthlyAttendanceReport(
            [FromQuery] int month,
            [FromQuery] int year,
            [FromQuery] int? departmentId)
        {
            try
            {
                var userContext = ResolveUserContext();
                var result = await _mediator.Send(new GetMonthlyAttendanceReportQuery
                {
                    Month = month,
                    Year = year,
                    DepartmentId = departmentId,
                    RequestUserId = userContext.UserId,
                    IsAdminOrHr = userContext.IsAdminOrHr,
                    IsManager = userContext.IsManager
                });

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("production-lines")]
        public async Task<ActionResult<List<ProductionLineAttendanceReportDto>>> GetProductionLineReport([FromQuery] int? departmentId)
        {
            try
            {
                var userContext = ResolveUserContext();
                var result = await _mediator.Send(new GetProductionLineReportQuery
                {
                    DepartmentId = departmentId,
                    RequestUserId = userContext.UserId,
                    IsAdminOrHr = userContext.IsAdminOrHr,
                    IsManager = userContext.IsManager
                });

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpGet("departments")]
        public async Task<ActionResult<List<DepartmentAttendanceReportDto>>> GetDepartmentReport()
        {
            try
            {
                var userContext = ResolveUserContext();
                var result = await _mediator.Send(new GetDepartmentReportQuery
                {
                    RequestUserId = userContext.UserId,
                    IsAdminOrHr = userContext.IsAdminOrHr,
                    IsManager = userContext.IsManager
                });

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpGet("export-attendance")]
        public async Task<IActionResult> ExportMonthlyAttendance(
            [FromQuery] int month,
            [FromQuery] int year,
            [FromQuery] int? departmentId)
        {
            try
            {
                var userContext = ResolveUserContext();
                var file = await _mediator.Send(new ExportMonthlyAttendanceReportQuery
                {
                    Month = month,
                    Year = year,
                    DepartmentId = departmentId,
                    RequestUserId = userContext.UserId,
                    IsAdminOrHr = userContext.IsAdminOrHr,
                    IsManager = userContext.IsManager
                });

                return File(file.Content, file.ContentType, file.FileName);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private (Guid? UserId, bool IsAdminOrHr, bool IsManager) ResolveUserContext()
        {
            var isAdminOrHr = User.IsInRole("Admin")
                || User.IsInRole("Administrator")
                || User.IsInRole("HR");
            var isManager = User.IsInRole("Manager");

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid? userId = null;
            if (Guid.TryParse(userIdClaim, out var parsedUserId))
            {
                userId = parsedUserId;
            }

            return (userId, isAdminOrHr, isManager);
        }
    }
}
