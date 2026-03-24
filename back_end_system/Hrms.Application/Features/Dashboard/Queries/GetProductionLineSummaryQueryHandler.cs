using MediatR;
using Hrms.Application.DTOs.Dashboard;
using Hrms.Application.Interface;
using Hrms.Domain.Enums;

namespace Hrms.Application.Features.Dashboard.Queries
{
    public class GetProductionLineSummaryQueryHandler : IRequestHandler<GetProductionLineSummaryQuery, IEnumerable<ProductionLineSummaryDto>>
    {
        private readonly IProductionLineRepository _productionLineRepository;
        private readonly IShiftAssignmentRepository _shiftAssignmentRepository;
        private readonly IAttendanceRecordRepository _attendanceRecordRepository;
        private readonly IManagementRepository _managementRepository;

        public GetProductionLineSummaryQueryHandler(
            IProductionLineRepository productionLineRepository,
            IShiftAssignmentRepository shiftAssignmentRepository,
            IAttendanceRecordRepository attendanceRecordRepository,
            IManagementRepository managementRepository)
        {
            _productionLineRepository = productionLineRepository;
            _shiftAssignmentRepository = shiftAssignmentRepository;
            _attendanceRecordRepository = attendanceRecordRepository;
            _managementRepository = managementRepository;
        }

        public async Task<IEnumerable<ProductionLineSummaryDto>> Handle(GetProductionLineSummaryQuery request, CancellationToken cancellationToken)
        {
            var tzInfo = TimeZoneInfo.FindSystemTimeZoneById(
                Environment.OSVersion.Platform == PlatformID.Win32NT ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");
            var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tzInfo);
            var today = now.Date;

            // 1. Lấy danh sách lines được phép xem
            var allLines = await _productionLineRepository.GetAllAsync(cancellationToken);
            IEnumerable<Hrms.Domain.Entities.ProductionLine> lines;

            if (request.CurrentUserRole == "Manager")
            {
                var managementAssignments = await _managementRepository.GetByUserIdAsync(request.CurrentUserId, cancellationToken);
                var assignedDeptIds = managementAssignments.Select(m => m.DepartmentId).Distinct().ToList();
                lines = allLines.Where(l => assignedDeptIds.Contains(l.DepartmentId));
            }
            else
            {
                lines = allLines;
            }

            // 2. Lấy danh sách gán ca hôm nay để biết số lượng nhân viên mỗi line
            var allAssignments = await _shiftAssignmentRepository.GetAllAsync(cancellationToken);
            var todayAssignments = allAssignments.Where(sa => sa.FromDate.Date <= today && sa.ToDate.Date >= today).ToList();

            var attendanceRecords = (await _attendanceRecordRepository.GetAllAsync(cancellationToken))
                                    .Where(a => a.WorkDate.Date == today).ToList();

            var result = new List<ProductionLineSummaryDto>();

            foreach (var line in lines)
            {
                var lineAssignments = todayAssignments.Where(sa => sa.ProductionLineId == line.Id).ToList();
                var lineEmployeeIds = lineAssignments.Select(sa => sa.EmployeeId).Distinct().ToList();

                var lineRecords = attendanceRecords.Where(a => lineEmployeeIds.Contains(a.EmployeeId)).ToList();

                var presentCount = lineRecords
                    .Where(a => a.CheckInTime.HasValue)
                    .Select(a => a.EmployeeId)
                    .Distinct()
                    .Count();

                var lateCount = lineRecords.Count(a => a.Status == AttendanceStatus.Late);

                result.Add(new ProductionLineSummaryDto
                {
                    ProductionLine = line.LineName,
                    TotalEmployees = lineEmployeeIds.Count,
                    Present = presentCount,
                    Late = lateCount
                });
            }

            return result;
        }
    }
}
