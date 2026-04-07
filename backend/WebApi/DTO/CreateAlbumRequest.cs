namespace WebApi.DTO;

public class CreateAlbumRequest
{
    public string Name { get; set; }
    public string? Description { get; set; }
    public string? Genre { get; set; }
    public Guid UserId { get; set; }
    public int Year { get; set; }
    public IFormFile? Image { get; set; }
}