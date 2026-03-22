using WebApi.DTO;
using WebApi.Persistence.Models;

namespace WebApi.Interfaces.Services;

public interface IUserService
{
    Task Register(RegisterUserRequest user);
    Task<LoginUserResponse?> Login(LoginUserRequest user);
    Task<GetUserResponse?> GetUserById(Guid id);
    Task<GetUserResponse> UpdateUser(Guid id, UpdateUserRequest user);
    Task<List<User>> GetAllUsers();
    Task BlockUser(Guid id);
    Task Logout(Guid id);
}