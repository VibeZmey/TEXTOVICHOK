using Microsoft.EntityFrameworkCore;
using WebApi.Interfaces;
using WebApi.Interfaces.Repositories;
using WebApi.Persistence.Models;

namespace WebApi.Repositories;

public class RefreshTokenRepository(IAppDbContext context) 
    : IRefreshTokenRepository
{
    public async Task Add(RefreshToken refreshToken, CancellationToken cancellationToken = default)
    {
        await context.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<RefreshToken?> GetByRefreshToken(string refreshToken,
        CancellationToken cancellationToken = default)
    {
        return await context
            .RefreshTokens
            .FirstOrDefaultAsync(t =>
                t.Token == refreshToken, cancellationToken);
    }
    
    public async Task<RefreshToken?> GetByUserId(Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await context
            .RefreshTokens
            .FirstOrDefaultAsync(t =>
                t.UserId == userId, cancellationToken);
    }

    public async Task Delete(RefreshToken refreshToken, CancellationToken cancellationToken = default)
    {
        context.RefreshTokens.Remove(refreshToken);
        await context.SaveChangesAsync(cancellationToken);
    }
}