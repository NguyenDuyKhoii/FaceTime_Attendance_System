using MediatR;
using Hrms.Application.DTOs.Attendance;
using System;

namespace Hrms.Application.Features.Attendance.Queries
{
    public class GetAttendanceDetailQuery : IRequest<AttendanceDetailDto?>
    {
        public Guid Id { get; set; }
        public Guid CurrentUserId { get; set; }
        public string CurrentUserRole { get; set; } = null!;
    }
}
