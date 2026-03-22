using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WebApi.DTO;
using WebApi.Interfaces;
using WebApi.Interfaces.Repositories;
using WebApi.Interfaces.Services;
using WebApi.Persistence.Models;

namespace WebApi.Repositories;

public class UserRepository(IAppDbContext context) 
    : IUserRepository
{
    public async Task AddUser(User user, 
        CancellationToken cancellationToken = default)
    {
        await context.Users.AddAsync(user, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<User?> GetUserByLogin(string login, CancellationToken ct = default)
    {
        User? user = await context.Users.FirstOrDefaultAsync(user => user.Login == login, ct);
        return user;
    }

    public async Task<User?> GetUserById(Guid userId, CancellationToken ct = default)
    {
        User? user = await context.Users.FirstOrDefaultAsync(user => user.Id == userId, ct);
        return user;
    }

    public async Task<User?> UpdateUser(Guid id, UpdateUserRequest user, CancellationToken ct = default)
    {
        User? userToUpdate = await GetUserById(id, ct);
        
        if (user.Password is not null)
        {
            userToUpdate.PasswordHash = new PasswordHasher<User>().HashPassword(userToUpdate, user.Password);
        }
        
        userToUpdate.Login = user.Login ??  userToUpdate.Login;
        userToUpdate.Description = user.Description ?? userToUpdate.Description;
        userToUpdate.Email = user.Email ?? userToUpdate.Email;

        await context.SaveChangesAsync(ct);
        return userToUpdate;
    }

    public async Task<List<User>> GetAllUsers(CancellationToken ct = default)
    {
        return await context.Users.ToListAsync(ct);
    }

    public async Task BlockUser(Guid id, CancellationToken ct = default)
    {
        User? user = await context
            .Users
            .FirstOrDefaultAsync(u =>
                u.Id == id, ct);
        
        if(user is null) throw new Exception("User not found");
        
        user.IsBlocked = true;
        await context.SaveChangesAsync(ct);
    }
}