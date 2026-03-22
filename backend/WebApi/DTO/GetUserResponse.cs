namespace WebApi.DTO;

public class GetUserResponse
{
    public Guid Id { get; set; }
    public string Login { get; set; }
    public string? Description { get; set; }
    public string? Email { get; set; }
    public bool IsEditor { get; set; }
    public bool IsArtist { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsBlocked { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}