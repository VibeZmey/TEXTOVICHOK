using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApi.DTO;
using WebApi.Interfaces.Repositories;
using WebApi.Persistence.Models;

namespace WebApi.Controllers;

[ApiController]
[Authorize(Roles = "Admin, User")]
[Route("annotation")]
public class AnnotationController(IAnnotationRepository annotationRepository) 
    : ControllerBase
{
    /// <summary>
    /// Создает новую аннотацию.
    /// </summary>
    [Authorize(Roles = "Admin, User")]
    [HttpPost]
    public async Task<ActionResult<Annotation>> CreateAnnotation([FromBody] CreateAnnotationRequest annotation)
    {
        return Ok(await annotationRepository.CreateAnnotation(annotation));
    }

    /// <summary>
    /// Получает список непроверенных аннотаций.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("unverified")]
    public async Task<ActionResult<List<Annotation>>> GetUnverifiedAnnotations()
    {
        return await annotationRepository.GetUnverifiedAnnotations();
    }

    /// <summary>
    /// Получает аннотацию по ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Annotation>> GetAnnotationById(Guid id)
    {
        return Ok(await annotationRepository.GetAnnotationById(id));
    }
    
    /// <summary>
    /// Подтверждает аннотацию.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/verify")]
    public async Task<ActionResult> VerifyAnnotation(Guid id)
    {
        await annotationRepository.VerifyAnnotation(id);
        return NoContent();
    }
    
    /// <summary>
    /// Отклоняет аннотацию (статус: отклонено).
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/reject")]
    public async Task<ActionResult> RejectAnnotation(Guid id)
    {
        await annotationRepository.RejectAnnotation(id);
        return NoContent();
    }

    /// <summary>
    /// Обновляет данные аннотации.
    /// </summary>
    [Authorize(Roles = "Admin, User")]
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<Annotation>> UpdateAnnotation(Guid id,
        [FromBody] UpdateAnnotationRequest annotation)
    {
        return Ok(await annotationRepository.UpdateAnnotation(id, annotation));
    }

    /// <summary>
    /// Удаляет аннотацию по ID.
    /// </summary>
    [Authorize(Roles = "Admin, User")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAnnotation(Guid id)
    {
        await annotationRepository.DeleteAnnotation(id);
        return NoContent();
    }
}