using System.Security.Cryptography;
using Moq;
using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using WebApi.Services;
using WebApi.Interfaces.Repositories;
using WebApi.Interfaces.Services;
using WebApi.DTO;
using WebApi.Persistence.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;

namespace WebApi.Tests;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly Mock<IS3Service> _s3ServiceMock;
    private readonly Mock<IRefreshTokenRepository> _refreshTokenRepositoryMock;
    
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _jwtServiceMock = new Mock<IJwtService>();
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _s3ServiceMock = new Mock<IS3Service>();
        _refreshTokenRepositoryMock = new Mock<IRefreshTokenRepository>();
        
        _userService = new UserService(
            _userRepositoryMock.Object,
            _jwtServiceMock.Object,
            _roleRepositoryMock.Object,
            _s3ServiceMock.Object,
            _refreshTokenRepositoryMock.Object
        );
    }

    [Fact]
    public async Task Login_WithCorrectPassword_ReturnsJwt()
    {
        //Arrange
        var loginRequest = new LoginUserRequest()
        {
            Login = "admin",  
            Password = "password"
        };

        var user = new User()
        {
            Login = "admin",
            PasswordHash = new PasswordHasher<User>().HashPassword(null, loginRequest.Password)
        };
        _userRepositoryMock.Setup(r => r.GetUserByLogin("admin")).ReturnsAsync(user);
        var expectedToken = new LoginUserResponse { AccessToken = "fake_jwt_token" };
        _jwtServiceMock.Setup(j => j.GenerateJwt(user)).ReturnsAsync(expectedToken);

        //Act
        var result = await _userService.Login(loginRequest);
        
        //Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("fake_jwt_token");
    }
    
    [Fact]
    public async Task Login_WithWrongPassword_ThrowsException()
    {
        //Arrange
        var loginRequest = new LoginUserRequest()
        {
            Login = "admin",  
            Password = "password"
        };

        var user = new User()
        {
            Login = "admin",
            PasswordHash = new PasswordHasher<User>().HashPassword(null, "wrong_password")
        };
        _userRepositoryMock.Setup(r => r.GetUserByLogin("admin")).ReturnsAsync(user);
        
        //Act&Assert
        await Assert.ThrowsAsync<Exception>(() => _userService.Login(loginRequest));
    }
    
    [Fact]
    public async Task Login_WhenUserBlocked_ThrowsException()
    {
        //Arrange
        var loginRequest = new LoginUserRequest()
        {
            Login = "banned",  
            Password = "password"
        };

        var user = new User()
        {
            Login = "banned",
            PasswordHash = new PasswordHasher<User>().HashPassword(null, "password"),
            IsBlocked = true,
        };
        _userRepositoryMock.Setup(r => r.GetUserByLogin("banned")).ReturnsAsync(user);
        
        //Act&Assert
        var exception = await Assert.ThrowsAsync<Exception>(() => _userService.Login(loginRequest));
        exception.Message.Should().Contain("blocked");
    }

    [Fact]
    public async Task UpdateUser_WithImage_UploadsToS3()
    {
        Guid userId = Guid.NewGuid();
        UpdateUserRequest updateRequest = new UpdateUserRequest()
        {
            Description = "Updated Description",
            Image = new FormFile(null, 0, 0, "image", "image"),
        };
        
        var existingUser = new User { Id = userId, Login = "test", ImageUrl = "url" };
        
        _userRepositoryMock
            .Setup(r => 
                r.UpdateUser(userId, updateRequest))
            .ReturnsAsync(existingUser);

        // Act
        await _userService.UpdateUser(userId, updateRequest);

        // Assert
        _s3ServiceMock
            .Verify(s => 
                s.UploadFileAsync(It.IsAny<FormFile>(), userId.ToString()), Times.Once);
    }
    
        
    [Fact]
    public async Task Logout_WhenTokenExists_DeletesToken()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var token = new RefreshToken {UserId = userId };
        
        _refreshTokenRepositoryMock
            .Setup(r => r.GetByUserId(userId))
            .ReturnsAsync(token);
            
        _refreshTokenRepositoryMock
            .Setup(r => r.Delete(token))
            .Returns(Task.CompletedTask);

        // Act
        await _userService.Logout(userId);

        // Assert
        _refreshTokenRepositoryMock.Verify(r => r.Delete(token), Times.Once);
    }
    
}