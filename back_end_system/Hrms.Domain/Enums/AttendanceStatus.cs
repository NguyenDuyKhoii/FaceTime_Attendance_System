namespace Hrms.Domain.Enums
{
    /// <summary>
    /// Enum định nghĩa trạng thái attendance của nhân viên
    /// </summary>
    public enum AttendanceStatus
    {
        /// <summary>
        /// Đúng giờ
        /// </summary>
        OnTime = 0,

        /// <summary>
        /// Đi muộn
        /// </summary>
        Late = 1,

        /// <summary>
        /// Về sớm
        /// </summary>
        EarlyLeave = 2,

        /// <summary>
        /// Vắng mặt
        /// </summary>
        Absent = 3,

        /// <summary>
        /// Nghỉ phép
        /// </summary>
        OnLeave = 4,

        /// <summary>
        /// Nghỉ ốm
        /// </summary>
        SickLeave = 5
    }
}
