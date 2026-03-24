using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Hrms.Application.DTOs.Dashboard;
using Hrms.Application.Features.Dashboard.Queries;
using System.Security.Claims;

namespace Hrms.Api.Controllers
{
    /// <summary>
    /// Controller hiển thị Dashboard thống kê
    /// Module 5: Dashboard (Owner: Lộc)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IMemoryCache _cache;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(IMediator mediator, IMemoryCache cache, ILogger<DashboardController> logger)
        {
            _mediator = mediator;
            _cache = cache;
            _logger = logger;
        }

        /// <summary>
        /// Lấy tổng quan chấm công hôm nay
        /// GET /api/Dashboard/today
        /// </summary>
        [HttpGet("today")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<TodayAttendanceDto>> GetTodayAttendance()
        {
            try
            {
                const string cacheKey = "dashboard:today";
                if (!_cache.TryGetValue(cacheKey, out TodayAttendanceDto? result))
                {
                    result = await _mediator.Send(new GetTodayAttendanceQuery());
                    var cacheOptions = new MemoryCacheEntryOptions()
                        .SetAbsoluteExpiration(TimeSpan.FromSeconds(30)); 
                    _cache.Set(cacheKey, result, cacheOptions);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting today attendance summary");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thống kê hôm nay" });
            }
        }

        /// <summary>
        /// Thống kê chấm công theo phòng ban
        /// GET /api/Dashboard/department-summary
        /// </summary>
        [HttpGet("department-summary")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<IEnumerable<DepartmentSummaryDto>>> GetDepartmentSummary()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var role = User.FindFirst(ClaimTypes.Role)?.Value;

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(role))
                {
                    return Unauthorized();
                }

                // Cache key phụ thuộc vào role/userId nếu cần phân quyền chi tiết hơn
                // Ở đây chỉ Admin/HR mới được gọi endpoint này theo yêu cầu section 9
                string cacheKey = $"dashboard:department:{role}";
                
                if (!_cache.TryGetValue(cacheKey, out IEnumerable<DepartmentSummaryDto>? result))
                {
                    var query = new GetDepartmentSummaryQuery
                    {
                        CurrentUserId = Guid.Parse(userId),
                        CurrentUserRole = role
                    };
                    result = await _mediator.Send(query);
                    
                    var cacheOptions = new MemoryCacheEntryOptions()
                        .SetAbsoluteExpiration(TimeSpan.FromSeconds(30));
                    _cache.Set(cacheKey, result, cacheOptions);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting department summary");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thống kê phòng ban" });
            }
        }

        /// <summary>
        /// Thống kê chấm công theo production line
        /// GET /api/Dashboard/production-line-summary
        /// </summary>
        [HttpGet("production-line-summary")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<IEnumerable<ProductionLineSummaryDto>>> GetProductionLineSummary()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var role = User.FindFirst(ClaimTypes.Role)?.Value;

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(role))
                {
                    return Unauthorized();
                }

                string cacheKey = $"dashboard:line:{role}";

                if (!_cache.TryGetValue(cacheKey, out IEnumerable<ProductionLineSummaryDto>? result))
                {
                    var query = new GetProductionLineSummaryQuery
                    {
                        CurrentUserId = Guid.Parse(userId),
                        CurrentUserRole = role
                    };
                    result = await _mediator.Send(query);

                    var cacheOptions = new MemoryCacheEntryOptions()
                        .SetAbsoluteExpiration(TimeSpan.FromSeconds(30));
                    _cache.Set(cacheKey, result, cacheOptions);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting production line summary");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thống kê dây chuyền" });
            }
        }
    }
}
