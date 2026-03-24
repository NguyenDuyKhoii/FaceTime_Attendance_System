using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductionLinesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ProductionLinesController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll()
        {
            var result = await _mediator.Send(new Hrms.Application.Features.ProductionLines.Queries.GetAllProductionLinesQuery());
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,HR,Administrator")]
        public async Task<ActionResult> Create([FromBody] Hrms.Application.Features.ProductionLines.Commands.CreateProductionLineCommand command)
        {
            var id = await _mediator.Send(command);
            return Ok(new { id, message = "Production Line created successfully" });
        }
    }
}
