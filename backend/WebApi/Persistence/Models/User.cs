using System.Text.Json.Serialization;

namespace WebApi.Persistence.Models;

public class User
{
    public Guid Id { get; set; }
    public string Login { get; set; }
    public string PasswordHash { get; set; }
    public string? Description { get; set; }
    public string? Email { get; set; }
    public bool IsEditor { get; set; } = false;
    public bool IsArtist { get; set; } = false;
    public string? ImageUrl { get; set; }
    public bool IsBlocked { get; set; } = false;
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    public Guid RoleId { get; set; }
    [JsonIgnore]
    public Role Role { get; set; }
    [JsonIgnore]
    public List<Album> Albums { get; set; }
    [JsonIgnore]
    public List<Annotation> Annotations { get; set; }
    [JsonIgnore]
    public List<RefreshToken> RefreshTokens { get; set; }
}