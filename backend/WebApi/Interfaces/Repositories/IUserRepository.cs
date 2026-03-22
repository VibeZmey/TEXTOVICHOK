using WebApi.DTO;
using WebApi.Persistence.Models;

namespace WebApi.Interfaces.Repositories;

public interface IUserRepository
{
    Task AddUser(User user, CancellationToken ct = default);
    Task<User?> GetUserByLogin(string login, CancellationToken ct = default);
    Task<User?> GetUserById(Guid userId, CancellationToken ct = default);
    Task<User?> UpdateUser(Guid id, UpdateUserRequest user, CancellationToken ct = default);
    Task<List<User>> GetAllUsers(CancellationToken ct = default);
    Task BlockUser(Guid id, CancellationToken ct = default);
}