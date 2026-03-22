using System.Text.Json.Serialization;

namespace WebApi.Persistence.Models;

public class Lyrics
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public Guid AlbumId { get; set; }
    [JsonIgnore]
    public Album Album { get; set; }
    
    public int OrderIndex { get; set; }
    public string Text { get; set; }
    public string? Description { get; set; }
    public int Views { get; set; }
    public int Duration { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    [JsonIgnore]
    public List<Annotation> Annotations { get; set; }
}