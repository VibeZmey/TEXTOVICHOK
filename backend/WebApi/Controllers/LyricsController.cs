using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApi.DTO;
using WebApi.Interfaces.Repositories;
using WebApi.Interfaces.Services;
using WebApi.Persistence.Models;

namespace WebApi.Controllers;

[ApiController]
[Authorize(Roles = "Admin, User")]
[Route("lyrics")]
public class LyricsController(
    ILyricsRepository lyricsRepository,
    IAnnotationRepository annotationRepository) 
    : ControllerBase
{
    /// <summary>
    /// Создает новую песню.
    /// </summary>
    [Authorize(Roles = "Admin, User")]
    [HttpPost]
    public async Task<ActionResult<Lyrics>> Create([FromBody] CreateLyricsRequest lyrics)
    {
        return Ok(await lyricsRepository.CreateLyrics(lyrics));
    }

    /// <summary>
    /// Получает все аннотации для конкретной песни.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}/annotations")]
    public async Task<ActionResult<List<Annotation>>> GetLyricsByAnnotationId([FromRoute] Guid id)
    {
        return Ok(await annotationRepository.GetAnnotationsByLyricsId(id));
    }

    /// <summary>
    /// Получить песню по ID
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Lyrics>> GetAnnotationById([FromRoute] Guid id)
    {
        return Ok(await lyricsRepository.GetLyricsById(id));
    }
    
    /// <summary>
    /// Обновляет существующую песню.
    /// </summary>
    [Authorize(Roles = "Admin, User")]
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<Lyrics>> PatchLyrics(Guid id, [FromBody] UpdateLyricsRequest lyrics)
    {
        return Ok(await lyricsRepository.UpdateLyrics(id, lyrics));
    }

    /// <summary>
    /// Удаляет текст песню по ID.
    /// </summary>
    [Authorize(Roles = "Admin, User")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteLyrics(Guid id, CancellationToken cancellationToken = default)
    {
        await lyricsRepository.DeleteLyrics(id, cancellationToken);
        return NoContent();
    }
}
