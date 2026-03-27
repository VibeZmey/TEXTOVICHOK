using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApi.DTO;
using WebApi.Interfaces.Repositories;
using WebApi.Interfaces.Services;
using WebApi.Persistence.Models;

namespace WebApi.Controllers;

[ApiController]
[Route("albums")]
public class AlbumController(
    IAlbumRepository albumRepository,
    ILyricsRepository lyricsRepository) : ControllerBase
{

    /// <summary>
    /// Создает новый альбом.
    /// </summary>
    [Authorize(Roles = "Admin, User")]
    [HttpPost]
    public async Task<ActionResult<Album>> Create([FromForm] CreateAlbumRequest album)
    {
        var newAlbum = await albumRepository.CreateAlbum(album);
        return Ok(newAlbum);
    }

    /// <summary>
    /// Получить альбом по ID
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Album>> GetAlbumById([FromRoute] Guid id)
    {
        return Ok(await albumRepository.GetAlbumById(id));
    }
    
    /// <summary>
    /// Получает список всех альбомов.
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<List<Album>>> GetAllAlbums()
    {
        return Ok(await albumRepository.GetAllAlbums());
    }
    
    /// <summary>
    /// Получает песни по ID альбома.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}/lyrics")]
    public async Task<ActionResult<List<Lyrics>>> GetLyricsByAlbumId(Guid id)
    {
        return Ok(await lyricsRepository.GetLyricsByAlbumId(id));
    }

    /// <summary>
    /// Обновляет существующий альбом по ID.
    /// </summary>
    [Authorize(Roles = "Admin, User")]
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<Album>> Update(Guid id, [FromForm] UpdateAlbumRequest album)
    {
        return Ok(await albumRepository.UpdateAlbum(id, album));
    }
    
    /// <summary>
    /// Удаляет альбом по ID.
    /// </summary>
    [Authorize(Roles = "Admin, User")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAlbum(Guid id)
    {
        await albumRepository.DeleteAlbum(id);
        return NoContent();
    }
}