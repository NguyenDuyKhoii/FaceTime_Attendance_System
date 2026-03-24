namespace Hrms.Domain.Entities
{
    /// <summary>
    /// Entity lưu trữ face template (embedding vector) của nhân viên
    /// Theo ERD: EmployeeId là PK và FK (one-to-one với Employee)
    /// Fields: ImagePath, EmbeddingVector, QualityScore, RegisteredDate, IsActive, Version
    /// </summary>
    public class FaceTemplate
    {
        /// <summary>
        /// ID nhân viên (PK và FK - one-to-one với Employee)
        /// </summary>
        public Guid EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;

        /// <summary>
        /// Đường dẫn đến ảnh gốc (để hiển thị)
        /// </summary>
        public string? ImagePath { get; set; }

        /// <summary>
        /// Embedding vector từ AI model (face recognition) - EmbeddingVector trong ERD
        /// </summary>
        public byte[] EmbeddingVector { get; set; } = null!;
 
        /// <summary>
        /// Điểm chất lượng của ảnh (0-1)
        /// </summary>
        public float? QualityScore { get; set; }

        /// <summary>
        /// Ngày đăng ký face template (RegisteredDate trong ERD)
        /// </summary>
        public DateTime RegisteredDate { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Template có đang active không
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Version của template (để quản lý nhiều version)
        /// </summary>
        public int Version { get; set; } = 1;
    }
}
