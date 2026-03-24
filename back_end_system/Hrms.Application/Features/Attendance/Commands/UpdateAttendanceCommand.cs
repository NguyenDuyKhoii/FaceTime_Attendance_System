using MediatR;
using System;

namespace Hrms.Application.Features.Attendance.Commands
{
    public class UpdateAttendanceCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public string? Note { get; set; }
        public Guid CurrentUserId { get; set; }
    }
}
