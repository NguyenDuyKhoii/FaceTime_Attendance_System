using MediatR;
using Hrms.Application.DTOs.Dashboard;
using Hrms.Application.Interface;
using Hrms.Domain.Enums;

namespace Hrms.Application.Features.Dashboard.Queries
{
    public class GetTodayAttendanceQueryHandler : IRequestHandler<GetTodayAttendanceQuery, TodayAttendanceDto>
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IAttendanceRecordRepository _attendanceRecordRepository;

        public GetTodayAttendanceQueryHandler(
            IEmployeeRepository employeeRepository,
            IAttendanceRecordRepository attendanceRecordRepository)
        {
            _employeeRepository = employeeRepository;
            _attendanceRecordRepository = attendanceRecordRepository;
        }

        public async Task<TodayAttendanceDto> Handle(GetTodayAttendanceQuery request, CancellationToken cancellationToken)
        {
            // Lấy thời gian hiện tại theo múi giờ Việt Nam
            var tzInfo = TimeZoneInfo.FindSystemTimeZoneById(
                Environment.OSVersion.Platform == PlatformID.Win32NT ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");
            var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tzInfo);
            var today = now.Date;

            var totalEmployees = (await _employeeRepository.GetAllAsync(cancellationToken))
                                    .Count(e => e.IsActive);

            var attendanceRecords = await _attendanceRecordRepository.GetAllAsync(cancellationToken);
            var todayRecords = attendanceRecords.Where(a => a.WorkDate.Date == today).ToList();

            var present = todayRecords
                .Where(a => a.CheckInTime.HasValue)
                .Select(a => a.EmployeeId)
                .Distinct()
                .Count();

            var late = todayRecords.Count(a => a.Status == AttendanceStatus.Late);
            var absent = totalEmployees - present;

            return new TodayAttendanceDto
            {
                Date = today,
                TotalEmployees = totalEmployees,
                Present = present,
                Late = late,
                Absent = absent >= 0 ? absent : 0
            };
        }
    }
}
