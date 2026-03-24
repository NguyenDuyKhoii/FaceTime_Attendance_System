using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hrms.Application.DTOs.IoTDevice;
using Hrms.Application.Features.IoTDevices.Commands;
using Hrms.Application.Features.IoTDevices.Queries;

namespace Hrms.Api.Controllers
{
    /// <summary>
    /// Controller quản lý IoT Devices
    /// Module 5: IoT Device Management
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class IoTDevicesController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<IoTDevicesController> _logger;

        public IoTDevicesController(IMediator mediator, ILogger<IoTDevicesController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Đăng ký IoT Device
        /// POST /api/iot-devices/register
        /// </summary>
        [HttpPost("register")]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult> RegisterDevice([FromBody] RegisterDeviceCommand command)
        {
            try
            {
                var deviceId = await _mediator.Send(command);
                return Ok(new { deviceId, message = "Device registered successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật IoT Device
        /// PUT /api/iot-devices/{id}
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult> UpdateDevice(int id, [FromBody] UpdateIoTDeviceCommand command)
        {
            if (id != command.Id)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            try
            {
                await _mediator.Send(command);
                return Ok(new { message = "Device updated successfully" });
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
        /// Cập nhật heartbeat từ device
        /// POST /api/iot-devices/{deviceId}/heartbeat
        /// </summary>
        [HttpPost("{deviceId}/heartbeat")]
        [AllowAnonymous] // Cho phép ESP32-CAM gọi
        public async Task<ActionResult> UpdateHeartbeat(string deviceId)
        {
            try
            {
                var command = new UpdateDeviceHeartbeatCommand { DeviceId = deviceId };
                var result = await _mediator.Send(command);
                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating heartbeat for device: {DeviceId}", deviceId);
                return StatusCode(500, new { message = "Error updating heartbeat" });
            }
        }

        /// <summary>
        /// Lấy danh sách devices
        /// GET /api/iot-devices
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Administrator,IT")]
        public async Task<ActionResult<List<IoTDeviceMonitoringDto>>> GetDevices()
        {
            var query = new GetIoTDevicesMonitoringQuery();
            var devices = await _mediator.Send(query);
            return Ok(devices);
        }

        /// <summary>
        /// Lấy trạng thái của một thiết bị
        /// GET /api/iot-devices/{id}/status
        /// </summary>
        [HttpGet("{id:int}/status")]
        [Authorize(Roles = "Admin,Administrator,IT")]
        public async Task<ActionResult<IoTDeviceStatusDto>> GetDeviceStatus(int id)
        {
            var result = await _mediator.Send(new GetIoTDeviceStatusQuery { DeviceId = id });
            if (result == null)
            {
                return NotFound(new { message = $"Không tìm thấy thiết bị với Id = {id}" });
            }

            return Ok(result);
        }
    }
}
