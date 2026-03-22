namespace WebApi.DTO;

public class CreateLyricsRequest
{
    public string Name { get; set; }
    public Guid AlbumId { get; set; }
    public int OrderIndex { get; set; }
    public string Text { get; set; }
    public int Duration { get; set; }
    public string? Description { get; set; }
}