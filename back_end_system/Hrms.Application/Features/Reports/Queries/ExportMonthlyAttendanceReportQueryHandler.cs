using ClosedXML.Excel;
using Hrms.Application.DTOs.Reports;
using MediatR;

namespace Hrms.Application.Features.Reports.Queries
{
    public class ExportMonthlyAttendanceReportQueryHandler : IRequestHandler<ExportMonthlyAttendanceReportQuery, ExcelFileResultDto>
    {
        private readonly IMediator _mediator;

        public ExportMonthlyAttendanceReportQueryHandler(IMediator mediator)
        {
            _mediator = mediator;
        }

        public async Task<ExcelFileResultDto> Handle(ExportMonthlyAttendanceReportQuery request, CancellationToken cancellationToken)
        {
            var monthlyData = await _mediator.Send(new GetMonthlyAttendanceReportQuery
            {
                Month = request.Month,
                Year = request.Year,
                DepartmentId = request.DepartmentId,
                RequestUserId = request.RequestUserId,
                IsAdminOrHr = request.IsAdminOrHr,
                IsManager = request.IsManager
            }, cancellationToken);

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Attendance");

            var headers = new[]
            {
                "Employee ID",
                "Employee Name",
                "Department",
                "Production Line",
                "Working Days",
                "Late Minutes",
                "Early Leave Minutes",
                "Overtime Hours",
                "Total Hours"
            };

            for (var i = 0; i < headers.Length; i++)
            {
                ws.Cell(1, i + 1).Value = headers[i];
                ws.Cell(1, i + 1).Style.Font.Bold = true;
            }

            var row = 2;
            foreach (var item in monthlyData)
            {
                ws.Cell(row, 1).Value = item.EmployeeCode;
                ws.Cell(row, 2).Value = item.EmployeeName;
                ws.Cell(row, 3).Value = item.Department;
                ws.Cell(row, 4).Value = item.ProductionLine;
                ws.Cell(row, 5).Value = item.WorkingDays;
                ws.Cell(row, 6).Value = item.LateMinutes;
                ws.Cell(row, 7).Value = item.EarlyLeaveMinutes;
                ws.Cell(row, 8).Value = item.OvertimeHours;
                ws.Cell(row, 9).Value = item.TotalHours;
                row++;
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);

            return new ExcelFileResultDto
            {
                Content = stream.ToArray(),
                ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                FileName = $"attendance-report-{request.Year:D4}-{request.Month:D2}.xlsx"
            };
        }
    }
}
