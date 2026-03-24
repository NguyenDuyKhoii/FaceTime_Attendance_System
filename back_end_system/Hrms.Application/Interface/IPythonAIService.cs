using Hrms.Application.DTOs.PythonAI;

namespace Hrms.Application.Interface
{
    /// <summary>
    /// Service interface để gọi Python AI Service
    /// Python AI Service chạy trên port 9000 với 2 endpoints chính:
    /// - POST /api/enroll: Đăng ký khuôn mặt mới
    /// - POST /api/recognize_face: Nhận diện khuôn mặt
    /// </summary>
    public interface IPythonAIService
    {
        /// <summary>
        /// Đăng ký khuôn mặt mới vào Python AI Service
        /// Gọi POST /api/enroll
        /// </summary>
        /// <param name="personId">Person ID (sử dụng EmployeeCode)</param>
        /// <param name="name">Tên nhân viên</param>
        /// <param name="imageBase64">Ảnh base64 (có thể có hoặc không có prefix "data:image/jpeg;base64,")</param>
        /// <returns>Response từ Python AI Service</returns>
        Task<PythonEnrollResponseDto> EnrollFaceAsync(string personId, string name, string imageBase64, CancellationToken cancellationToken = default);

        /// <summary>
        /// Nhận diện khuôn mặt qua Python AI Service
        /// Gọi POST /api/recognize_face
        /// </summary>
        /// <param name="deviceId">Device ID (optional)</param>
        /// <param name="imageBase64">Ảnh base64</param>
        /// <returns>Response từ Python AI Service với decision (accept/reject)</returns>
        Task<PythonRecognizeResponseDto> RecognizeFaceAsync(string? deviceId, string imageBase64, CancellationToken cancellationToken = default);

        /// <summary>
        /// Lấy danh sách ảnh đã enroll từ Python AI Service
        /// Gọi GET /api/get_images/{personId}
        /// </summary>
        Task<PythonGetImagesResponseDto> GetEnrolledImagesAsync(string personId, CancellationToken cancellationToken = default);
    }
}
