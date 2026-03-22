using WebApi.DTO;
using WebApi.Persistence.Models;

namespace WebApi.Interfaces.Repositories;

public interface IAlbumRepository
{
    Task<Album?> GetAlbumById(Guid id, CancellationToken cancellationToken = default);
    Task<Album> CreateAlbum(CreateAlbumRequest album, CancellationToken cancellationToken = default);
    Task<List<Album>> GetAllAlbums(CancellationToken cancellationToken = default);
    Task<List<Album>> GetAlbumsByUserId(Guid userId, CancellationToken cancellationToken = default);
    Task<Album> UpdateAlbum(Guid albumId, UpdateAlbumRequest album, CancellationToken cancellationToken = default);
    Task DeleteAlbum(Guid id, CancellationToken cancellationToken = default);
}