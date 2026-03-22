using System.Text.Json.Serialization;

namespace WebApi.Persistence.Models;

public class Annotation
{
    public Guid Id { get; set; }
    public Guid LyricsId { get; set; }
    [JsonIgnore]
    public Lyrics Lyrics { get; set; }
    
    public Guid UserId { get; set; }
    [JsonIgnore]
    public User User { get; set; }
    
    public int From { get; set; }
    public int To { get; set; }
    
    public string Text { get; set; }
    public bool IsVerified { get; set; } = false;
    
    public bool IsRejected { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}