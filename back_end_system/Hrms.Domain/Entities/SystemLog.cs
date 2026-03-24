namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity lưu system logs và audit trail
    /// </summary>
    public class SystemLog
    {
        public Guid Id { get; set; }
        
        /// <summary>
        /// ID người dùng thực hiện action (nullable nếu là system action)
        /// </summary>
        public Guid? UserId { get; set; }
        public UserAccount? UserAccount { get; set; }
        
        /// <summary>
        /// Thời điểm log được tạo
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        /// <summary>
        /// Loại action: Login, Logout, Create, Update, Delete, FaceRecognition, CheckIn, CheckOut, etc.
        /// </summary>
        public string ActionType { get; set; } = null!;
        
        /// <summary>
        /// Mô tả chi tiết về action
        /// </summary>
        public string Description { get; set; } = null!;
        
        /// <summary>
        /// Địa chỉ IP của client
        /// </summary>
        public string? IpAddress { get; set; }
        
        /// <summary>
        /// User agent của client
        /// </summary>
        public string? UserAgent { get; set; }
        
        /// <summary>
        /// Entity liên quan (ví dụ: EmployeeId, AttendanceRecordId)
        /// </summary>
        public string? EntityType { get; set; }
        public Guid? EntityId { get; set; }
        
        /// <summary>
        /// Mức độ log: Info, Warning, Error, Critical
        /// </summary>
        public string LogLevel { get; set; } = "Info";
        
        /// <summary>
        /// Dữ liệu bổ sung (JSON format)
        /// </summary>
        public string? AdditionalData { get; set; }
    }
}
