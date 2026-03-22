using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApi.DTO;
using WebApi.Interfaces.Repositories;
using WebApi.Interfaces.Services;
using WebApi.Persistence.Models;

namespace WebApi.Controllers;

[ApiController]
[Route("user")]
public class UserController(
    IUserService userService,
    IAnnotationRepository annotationRepository,
    IAlbumRepository albumRepository) 
    : ControllerBase
{

    /// <summary>
    /// Получает данные пользователя по id.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<GetUserResponse>> GetMe()
    {
        var userId = User.FindFirst("userId").Value;

        var user = await userService.GetUserById(Guid.Parse(userId));
        if (user == null)
            return NotFound();
        return user;
    }
    
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<GetUserResponse>> GetUser(Guid id)
    {
        var user = await userService.GetUserById(id);
        if (user == null)
            return NotFound();
        return user;
    }
    
    /// <summary>
    /// Получает список всех альбомов пользователя.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}/albums")]
    public async Task<ActionResult<List<Album>>> GetAlbums(Guid id)
    { 
        return Ok(await albumRepository.GetAlbumsByUserId(id));
    }
    
    /// <summary>
    /// Получает все аннотации пользователя.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}/annotations")]
    public async Task<ActionResult<List<Annotation>>> GetAnnotations(Guid id)
    {
        return Ok(await annotationRepository.GetAnnotationsByUserId(id));
    }


    /// <summary>
    /// Обновляет данные текущего пользователя.
    /// </summary>
    [Authorize(Roles = "Admin, User")]
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<GetUserResponse>> PatchUser(Guid id, [FromForm] UpdateUserRequest user)
    {
        return Ok(await userService.UpdateUser(id, user));
    }

    /// <summary>
    /// Получить всех пользователей.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("all")]
    public async Task<ActionResult<List<User>>> GetAllUsers()
    {
        return Ok(await userService.GetAllUsers());
    }

    /// <summary>
    /// аблокировать пользователя.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/block")]
    public async Task<ActionResult> BlockUser(Guid id)
    {
        await userService.BlockUser(id);
        return NoContent();
    }
}