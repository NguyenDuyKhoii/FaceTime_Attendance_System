using System.Text.Json.Serialization;

namespace Hrms.Application.DTOs.PythonAI
{
    public class PythonImageDto
    {
        [JsonPropertyName("filename")]
        public string Filename { get; set; } = null!;

        [JsonPropertyName("data")]
        public string Data { get; set; } = null!;
    }

    public class PythonGetImagesResponseDto
    {
        [JsonPropertyName("ok")]
        public bool Ok { get; set; }

        [JsonPropertyName("person_id")]
        public string? PersonId { get; set; }

        [JsonPropertyName("images")]
        public List<PythonImageDto> Images { get; set; } = new();
    }
}
