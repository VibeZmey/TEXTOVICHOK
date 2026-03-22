namespace WebApi.DTO;

public class UpdateUserRequest
{
    public string? Login { get; set; }
    public string? Password { get; set; }
    public string? Description { get; set; }
    public IFormFile? Image { get; set; }
    public string? Email { get; set; }
}