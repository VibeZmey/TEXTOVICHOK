using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApi.DTO;
using WebApi.Interfaces.Repositories;
using WebApi.Interfaces.Services;
using WebApi.Objects.Enum;
using WebApi.Persistence.Models;

namespace WebApi.Controllers;

[ApiController]
[AllowAnonymous]
[Route("auth")]
public class AuthController(
    IUserService userService,
    IJwtService jwtService,
    IRoleRepository roleRepository) 
    : ControllerBase
{
    
    /// <summary>
    /// Выполняет вход пользователя (логин).
    /// </summary>
    /// <remarks>
    /// Принимает логин и пароль. Возвращает JWT-токены (Access + Refresh).
    /// </remarks>
    [HttpPost("login")]
    public async Task<ActionResult<LoginUserResponse>> Login(LoginUserRequest user)
    {
        var res = await userService.Login(user);

        return res is null ? Unauthorized() : Ok(res);
    }
    
    /// <summary>
    /// Регистрирует нового пользователя.
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserRequest user)
    {
        await userService.Register(user);
        return Ok();
    }
    
    /// <summary>
    /// Обновляет access-токен используя refresh-токен.
    /// </summary>
    /// <remarks>
    /// Отправьте refresh-токен в теле запроса. Возвращает новую пару токенов.
    /// </remarks>
    [HttpPost("refresh")]
    public async Task<ActionResult<LoginUserResponse>> Refresh(RefreshRequest request)
    {
        if(string.IsNullOrWhiteSpace(request.Token))
            return BadRequest("Invalid token");
        
        var res = await jwtService.ValidateRefreshJwt(request.Token);
        
        return res is null ? Unauthorized() : Ok(res);
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        var userId = User.FindFirst("userId").Value;

        var user = await userService.GetUserById(Guid.Parse(userId));
        if (user == null)
            return NotFound();

        await userService.Logout(Guid.Parse(userId));
        return Ok();
    }
    
}