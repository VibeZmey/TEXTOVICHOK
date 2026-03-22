using Microsoft.AspNetCore.Identity;
using WebApi.DTO;
using WebApi.Interfaces.Repositories;
using WebApi.Interfaces.Services;
using WebApi.Persistence.Models;

namespace WebApi.Services;

public class UserService(
    IUserRepository userRepository,
    IJwtService jwtService,
    IRoleRepository roleRepository,
    IS3Service minioService,
    IRefreshTokenRepository refreshTokenRepository
    ) : IUserService
{
    public async Task Register(RegisterUserRequest user)
    {
        Guid id = Guid.NewGuid();
        User newUser = new User()
        {
            Id = id,
            Login = user.Login,
            Email = user.Email,
            Description = user.Description,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = $"images/{id.ToString()}"
        };
        var passHash = new PasswordHasher<User>().HashPassword(newUser, user.Password);
        newUser.PasswordHash = passHash;
        
        var role = await roleRepository.GetRoleByName("User");
        if(role is null)
            throw new Exception("Role not found");
        
        newUser.RoleId = role.Id;
        
        await userRepository.AddUser(newUser);
    }

    public async Task<LoginUserResponse?> Login(LoginUserRequest loginUser)
    {
        User? user = await userRepository.GetUserByLogin(loginUser.Login);

        if (user is null) return null;
        
        var result = new PasswordHasher<User>()
            .VerifyHashedPassword(user, user.PasswordHash, loginUser.Password);
        
        if (result == PasswordVerificationResult.Failed)
            throw new Exception("Unauthorized");
        
        if(user.IsBlocked) throw new Exception($"Unauthorized, User: {user.Login} was blocked");
        
        return await jwtService.GenerateJwt(user);
    }
    
    public async Task<GetUserResponse?> GetUserById(Guid id)
    {
        var user = await userRepository.GetUserById(id);

        GetUserResponse response = new GetUserResponse()
        {
            Id = user.Id,
            Login = user.Login,
            Description = user.Description,
            Email = user.Email,
            IsEditor = user.IsEditor,
            IsArtist = user.IsArtist,
            ImageUrl = user.ImageUrl,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            IsBlocked = user.IsBlocked,
        };
        
        return response;
    }

    public async Task<GetUserResponse> UpdateUser(Guid id, UpdateUserRequest user)
    {
        var updatedUser = await userRepository.UpdateUser(id, user);
                
        if (user.Image is not null)
            await minioService.UploadFileAsync(user.Image, id.ToString());
        
        GetUserResponse response = new GetUserResponse()
        {
            Id = updatedUser.Id,
            Login = updatedUser.Login,
            Description = updatedUser.Description,
            Email = updatedUser.Email,
            IsEditor = updatedUser.IsEditor,
            IsArtist = updatedUser.IsArtist,
            ImageUrl = updatedUser.ImageUrl,
            CreatedAt = updatedUser.CreatedAt,
            UpdatedAt = updatedUser.UpdatedAt,
        };
        
        return response;
    }

    public async Task<List<User>> GetAllUsers()
    {
        return await userRepository.GetAllUsers();
    }

    public async Task BlockUser(Guid id)
    {
        await userRepository.BlockUser(id);
    }

    public async Task Logout(Guid id)
    {
        var token = await refreshTokenRepository.GetByUserId(id);
        if(token is null) throw new Exception("Refresh token not found");
        
        await refreshTokenRepository.Delete(token);
    }
    
}