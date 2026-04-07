using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using WebApi.DTO;
using WebApi.Interfaces;
using WebApi.Interfaces.Repositories;
using WebApi.Interfaces.Services;
using WebApi.Objects.Jwt;
using WebApi.Persistence.Models;

namespace WebApi.Services;

public class JwtService(
    IOptions<JwtOptions>  options,
    IRefreshTokenRepository refreshTokenRepository,
    IUserRepository userRepository,
    IRoleRepository roleRepository)
    : IJwtService
{
    private readonly JwtOptions _options = options.Value;
    
    public async Task<LoginUserResponse> GenerateJwt(User user)
    {
        var role = await roleRepository.GetRoleById(user.RoleId);
        if(role is null)
            throw new Exception("Role not found");
        
        Claim[] claims = [
            new ("userId", user.Id.ToString()),
            new ("role", role.Name)
        ];

        var tokenExpires = DateTime.UtcNow.AddMinutes(_options.TokenValidityMins);
        var signingCredentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SecretKey)),
            SecurityAlgorithms.HmacSha256);
        
        var jwtToken = new JwtSecurityToken(
            claims: claims,
            signingCredentials: signingCredentials,
            expires: tokenExpires);
        
        var AccessToken = new JwtSecurityTokenHandler().WriteToken(jwtToken);
        
        var res = new LoginUserResponse()
        {
            Login = user.Login,
            AccessToken = AccessToken,
            ExpiresIn = (int)tokenExpires.Subtract(DateTime.UtcNow).TotalSeconds,
            RefreshToken = await GenerateRefreshJwt(user.Id)
        };
        
        return res;
    }

    public async Task<LoginUserResponse?> ValidateRefreshJwt(string token)
    {
        var refreshToken = await refreshTokenRepository.GetByRefreshToken(token);
        
        if (refreshToken is null ||  refreshToken.Expires < DateTime.UtcNow) 
            return null;
        
        await refreshTokenRepository.Delete(refreshToken);
        
        var user = await userRepository.GetUserById(refreshToken.UserId);
        
        if(user is null)
            return null;
        
        return await GenerateJwt(user);
    }

    public async Task<string> GenerateRefreshJwt(Guid userId)
    {
        RefreshToken refreshToken = new RefreshToken()
        {
            Token = Guid.NewGuid().ToString(),
            UserId = userId,
            Expires = DateTime.UtcNow.AddMinutes(_options.RefreshTokenValidityMins)
        };
        
        await refreshTokenRepository.Add(refreshToken);
        
        return refreshToken.Token;
    }
}