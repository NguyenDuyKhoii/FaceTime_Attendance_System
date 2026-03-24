using System.Text.Json.Serialization;

namespace Hrms.Application.DTOs.PythonAI
{
    /// <summary>
    /// DTO cho response recognition từ Python AI Service
    /// Mapping từ Python response: {"ok": true, "device_id": "...", "decision": "accept/reject", "person_id": "...", "name": "...", "label": 1, "confidence": 45.2, "threshold": 85.0}
    /// </summary>
    public class PythonRecognizeResponseDto
    {
        [JsonPropertyName("ok")]
        public bool Ok { get; set; }

        [JsonPropertyName("device_id")]
        public string? DeviceId { get; set; }
        
        /// <summary>
        /// "accept" hoặc "reject"
        /// </summary>
        [JsonPropertyName("decision")]
        public string? Decision { get; set; }
        
        [JsonPropertyName("person_id")]
        public string? PersonId { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("label")]
        public int? Label { get; set; }
        
        /// <summary>
        /// Confidence score (LBPH distance, càng nhỏ càng giống)
        /// </summary>
        [JsonPropertyName("confidence")]
        public float? Confidence { get; set; }
        
        [JsonPropertyName("threshold")]
        public float? Threshold { get; set; }

        [JsonPropertyName("reason")]
        public string? Reason { get; set; }

        [JsonPropertyName("face_count")]
        public int? FaceCount { get; set; }
    }
}
