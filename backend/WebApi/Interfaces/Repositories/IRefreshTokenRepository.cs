using WebApi.Persistence.Models;

namespace WebApi.Interfaces.Repositories;

public interface IRefreshTokenRepository
{
    Task Add(RefreshToken refreshToken, CancellationToken cancellationToken = default);
    Task<RefreshToken?> GetByRefreshToken(string refreshToken, CancellationToken cancellationToken = default);
    Task Delete(RefreshToken refreshToken, CancellationToken cancellationToken = default);
    Task<RefreshToken?> GetByUserId(Guid userId, CancellationToken cancellationToken = default);
}