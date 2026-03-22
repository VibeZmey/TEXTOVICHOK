using Microsoft.EntityFrameworkCore;
using WebApi.Persistence.Models;

namespace WebApi.Interfaces;

public interface IAppDbContext
{
    DbSet<Album> Albums { get; set; }
    DbSet<Lyrics> Lyrics { get; set; }
    DbSet<User> Users { get; set; }
    DbSet<Role> Roles { get; set; }
    DbSet<Annotation> Annotations { get; set; }
    DbSet<RefreshToken> RefreshTokens { get; set; }

    Task SeedRolesAsync();
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}