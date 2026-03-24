using System.Text.Json.Serialization;

namespace Hrms.Application.DTOs.PythonAI
{
    /// <summary>
    /// DTO cho response enrollment từ Python AI Service
    /// Mapping từ Python response: {"ok": true, "ts": "...", "person_id": "...", "name": "...", "label": 1, "model_saved": true}
    /// </summary>
    public class PythonEnrollResponseDto
    {
        [JsonPropertyName("ok")]
        public bool Ok { get; set; }

        [JsonPropertyName("ts")]
        public string? Ts { get; set; }

        [JsonPropertyName("person_id")]
        public string? PersonId { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("label")]
        public int? Label { get; set; }

        [JsonPropertyName("model_saved")]
        public bool? ModelSaved { get; set; }

        [JsonPropertyName("reason")]
        public string? Reason { get; set; }

        [JsonPropertyName("face_count")]
        public int? FaceCount { get; set; }
    }
}
