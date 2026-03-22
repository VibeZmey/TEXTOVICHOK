using Microsoft.EntityFrameworkCore;
using WebApi.DTO;
using WebApi.Interfaces;
using WebApi.Interfaces.Repositories;
using WebApi.Interfaces.Services;
using WebApi.Persistence.Models;

namespace WebApi.Repositories;

public class AlbumRepository(
    IAppDbContext context,
    IUserRepository userRepository,
    IS3Service minioService) 
    : IAlbumRepository
{
    public async Task<Album?> GetAlbumById(Guid id, CancellationToken cancellationToken = default)
    {
        return await context
            .Albums
            .FirstOrDefaultAsync(a => 
                a.Id == id,  cancellationToken);
    }

    public async Task<Album> CreateAlbum(CreateAlbumRequest album, CancellationToken cancellationToken = default)
    {
        if(await context
               .Annotations
               .AnyAsync(a => 
                   a.UserId == album.UserId, cancellationToken))
        {
            var user = await userRepository.GetUserById(album.UserId, cancellationToken);
            if(user is null) 
                throw new Exception("User not found");
            user.IsEditor = true;
        }
        
        Guid id = Guid.NewGuid();
        if(album.Image is not null)
            await minioService.UploadFileAsync(album.Image, id.ToString());
        
        Album newAlbum = new Album()
        {
            Id = id,
            Name = album.Name,
            Description = album.Description,
            UserId = album.UserId,
            ImageUrl = $"images/{id}",
            CreatedAt = DateTime.UtcNow,
            Year = album.Year,
        };

        await context.Albums.AddAsync(newAlbum, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return newAlbum;
    }

    public async Task<List<Album>> GetAllAlbums(CancellationToken cancellationToken = default)
    {
        return await context
            .Albums
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Album>> GetAlbumsByUserId(Guid userId, CancellationToken cancellationToken = default)
    {
        return await context
            .Albums
            .Where(a => a.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task<Album> UpdateAlbum(Guid albumId, UpdateAlbumRequest album, CancellationToken cancellationToken = default)
    {
        var albumToUpdate = await GetAlbumById(albumId, cancellationToken);
        if(albumToUpdate is null)
            throw new Exception("Album not found");
        
        if(album.Image is not null)
            await minioService.UploadFileAsync(album.Image, albumId.ToString());

        albumToUpdate.Name = album.Name ?? albumToUpdate.Name;
        albumToUpdate.Description = album.Description ?? albumToUpdate.Description;
        albumToUpdate.Year = album.Year ?? albumToUpdate.Year;
        albumToUpdate.UpdatedAt = DateTime.UtcNow;

        await  context.SaveChangesAsync(cancellationToken);
        return albumToUpdate;
    }

    public async Task DeleteAlbum(Guid id, CancellationToken cancellationToken = default)
    {
        var albumToDelete = await GetAlbumById(id, cancellationToken);
        if(albumToDelete is null)
            throw new Exception("Album not found");
        
        await minioService.DeleteFileAsync(albumToDelete.ImageUrl.Split('/')[1]);
        context.Albums.Remove(albumToDelete);
        await context.SaveChangesAsync(cancellationToken);
    }
}