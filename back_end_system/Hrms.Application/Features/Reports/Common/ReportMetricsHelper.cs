using Hrms.Domain.Entities;
using Hrms.Domain.Enums;

namespace Hrms.Application.Features.Reports.Common
{
    internal static class ReportMetricsHelper
    {
        public static int CalculateEarlyLeaveMinutes(AttendanceSummary summary, Dictionary<Guid, Shift> shiftsById)
        {
            if (!summary.ShiftId.HasValue || !summary.CheckoutTime.HasValue)
            {
                return 0;
            }

            if (!shiftsById.TryGetValue(summary.ShiftId.Value, out var shift))
            {
                return 0;
            }

            var shiftEnd = summary.RecordDate.Date + shift.EndTime;
            if (shift.EndTime < shift.StartTime)
            {
                shiftEnd = shiftEnd.AddDays(1);
            }

            var checkout = summary.CheckoutTime.Value;
            if (checkout >= shiftEnd)
            {
                return 0;
            }

            var earlyMinutes = (int)Math.Floor((shiftEnd - checkout).TotalMinutes);
            return Math.Max(0, earlyMinutes);
        }

        public static bool IsPresent(AttendanceSummary summary)
        {
            return summary.CheckinTime.HasValue || summary.TotalHours > 0 || summary.Status != AttendanceStatus.Absent;
        }

        public static bool IsLate(AttendanceSummary summary)
        {
            return summary.LateMinutes > 0 || summary.Status == AttendanceStatus.Late;
        }
    }
}
