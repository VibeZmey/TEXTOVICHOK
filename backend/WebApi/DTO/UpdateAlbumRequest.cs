namespace WebApi.DTO;

public class UpdateAlbumRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Genre { get; set; }
    public int? Year { get; set; }
    public IFormFile? Image { get; set; }
}