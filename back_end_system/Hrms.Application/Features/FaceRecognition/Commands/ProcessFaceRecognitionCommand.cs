using MediatR;
using Hrms.Application.DTOs.FaceRecognition;

namespace Hrms.Application.Features.FaceRecognition.Commands
{
    /// <summary>
    /// Command xử lý nhận diện khuôn mặt từ ESP32-CAM
    /// </summary>
    public class ProcessFaceRecognitionCommand : IRequest<FaceRecognitionResponseDto>
    {
        public string ImageBase64 { get; set; } = null!;
        public string DeviceId { get; set; } = null!;
        public DateTime CapturedAt { get; set; } = DateTime.UtcNow;
    }
}
