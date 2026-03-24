using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hrms.Application.DTOs.FaceRecognition;
using Hrms.Application.Features.FaceRecognition.Commands;

namespace Hrms.Api.Controllers
{
    /// <summary>
    /// Controller xử lý Face Recognition
    /// Module 3: Face Recognition Integration
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class FaceRecognitionController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<FaceRecognitionController> _logger;

        public FaceRecognitionController(IMediator mediator, ILogger<FaceRecognitionController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }
    }
}
