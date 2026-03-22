using WebApi.DTO;
using WebApi.Persistence.Models;

namespace WebApi.Interfaces.Repositories;

public interface ILyricsRepository
{
    Task<Lyrics> CreateLyrics(CreateLyricsRequest lyric, CancellationToken cancellationToken = default);
    Task<List<Lyrics>> GetLyricsByAlbumId(Guid albumId, CancellationToken cancellationToken =  default);
    Task<Lyrics> GetLyricsById(Guid lyricsId, CancellationToken cancellationToken = default);
    Task<Lyrics> UpdateLyrics(Guid lyricsId, UpdateLyricsRequest lyrics, CancellationToken cancellationToken = default);
    Task DeleteLyrics(Guid lyricsId, CancellationToken cancellationToken = default);
}