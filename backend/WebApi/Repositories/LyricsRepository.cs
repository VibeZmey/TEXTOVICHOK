using Microsoft.EntityFrameworkCore;
using WebApi.DTO;
using WebApi.Interfaces;
using WebApi.Interfaces.Repositories;
using WebApi.Persistence.Models;

namespace WebApi.Repositories;

public class LyricsRepository(IAppDbContext context) 
    : ILyricsRepository
{
    public async Task<Lyrics> CreateLyrics(CreateLyricsRequest lyrics, CancellationToken cancellationToken = default)
    {
        Lyrics newLyrics = new Lyrics()
        {
            Id = Guid.NewGuid(),
            Name = lyrics.Name,
            AlbumId = lyrics.AlbumId,
            Text = lyrics.Text,
            OrderIndex = lyrics.OrderIndex,
            Description = lyrics.Description,
            CreatedAt = DateTime.UtcNow,
            Views = new Random().Next(1, 100000),
            Duration = lyrics.Duration,
        };
        
        await context.Lyrics.AddAsync(newLyrics, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return newLyrics;
    }

    public async Task<List<Lyrics>> GetLyricsByAlbumId(Guid albumId, CancellationToken cancellationToken = default)
    {
        return await context
            .Lyrics
            .Where(l => 
                l.AlbumId == albumId)
            .ToListAsync(cancellationToken);
    }

    public async Task<Lyrics> GetLyricsById(Guid lyricsId, CancellationToken cancellationToken = default)
    {
        var lyrics =  await context.Lyrics.FirstOrDefaultAsync(l => l.Id == lyricsId, cancellationToken);
        if(lyrics == null)
            throw new Exception($"Lyrics not found");
        
        return lyrics;
    }

    public async Task<Lyrics> UpdateLyrics(Guid lyricsId, UpdateLyricsRequest lyrics, CancellationToken cancellationToken = default)
    {
        var lyricsToUpdate = await GetLyricsById(lyricsId, cancellationToken);
        if(lyricsToUpdate is null)
            throw new Exception("Lyrics not found");
        
        lyricsToUpdate.Description = lyrics.Description ?? lyricsToUpdate.Description;
        lyricsToUpdate.UpdatedAt = DateTime.UtcNow;
        lyricsToUpdate.Name = lyrics.Name ?? lyricsToUpdate.Name;
        lyricsToUpdate.Text = lyrics.Text ?? lyricsToUpdate.Text;
        lyricsToUpdate.AlbumId = lyrics.AlbumId ?? lyricsToUpdate.AlbumId;
        lyricsToUpdate.OrderIndex = lyrics.OrderIndex ?? lyricsToUpdate.OrderIndex;
        lyricsToUpdate.Duration = lyrics.Duration ?? lyricsToUpdate.Duration;
        
        await  context.SaveChangesAsync(cancellationToken);
        return lyricsToUpdate;
    }

    public async Task DeleteLyrics(Guid id, CancellationToken cancellationToken = default)
    {
        var lyrics = await GetLyricsById(id, cancellationToken);
        if(lyrics is null)
            throw new Exception("Album not found");

        context.Lyrics.Remove(lyrics);
        await context.SaveChangesAsync(cancellationToken);
    }
}