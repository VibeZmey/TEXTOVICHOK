namespace WebApi.DTO;

public class CreateAnnotationRequest
{
    public Guid LyricsId { get; set; }
    public Guid UserId { get; set; }
    
    public int From { get; set; }
    public int To { get; set; }
    
    public string Text { get; set; }
}