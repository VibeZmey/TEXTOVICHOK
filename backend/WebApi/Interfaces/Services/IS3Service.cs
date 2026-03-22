namespace WebApi.Interfaces.Services;

public interface IS3Service
{
    Task<Stream> GetFileStreamAsync(string objectName);
    Task UploadFileAsync(IFormFile image, string id);
    Task DeleteFileAsync(string objectName);

}