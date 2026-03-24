using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hrms.Application.DTOs.Auth;
using Hrms.Application.Features.Auth.Commands;
using Hrms.Application.Features.Auth.Queries;

namespace Hrms.Api.Controllers
{
    /// <summary>
    /// Controller xử lý Authentication & Authorization
    /// Module 1: Authentication & Authorization
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IMediator mediator, ILogger<AuthController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Đăng ký tài khoản mới (Admin tạo account cho các role)
        /// POST /api/auth/register
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<RegisterResponseDto>> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                var command = new RegisterCommand
                {
                    Username = request.Username,
                    Password = request.Password,
                    ConfirmPassword = request.ConfirmPassword,
                    RoleId = request.RoleId
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
                _logger.LogError(ex, "Error during registration for user: {Username}", request.Username);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi đăng ký tài khoản" });
            }
        }

        /// <summary>
        /// Đăng nhập vào hệ thống
        /// POST /api/auth/login
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                var command = new LoginCommand
                {
                    Username = request.Username,
                    Password = request.Password
                };

                var result = await _mediator.Send(command);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for user: {Username}", request.Username);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi đăng nhập" });
            }
        }
    }
}
