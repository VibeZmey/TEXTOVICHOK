using Microsoft.EntityFrameworkCore;
using WebApi.DTO;
using WebApi.Interfaces;
using WebApi.Interfaces.Repositories;
using WebApi.Persistence.Models;

namespace WebApi.Repositories;

public class AnnotationRepository(
    IAppDbContext context, 
    IUserRepository userRepository) 
    : IAnnotationRepository
{
    public async Task<Annotation> CreateAnnotation(CreateAnnotationRequest annotation, CancellationToken cancellationToken = default)
    {
        if(await context
               .Annotations
               .AnyAsync(a => 
                   a.UserId == annotation.UserId, cancellationToken))
        {
            var user = await userRepository.GetUserById(annotation.UserId, cancellationToken);
            if(user is null) 
                throw new Exception("User not found");
            user.IsEditor = true;
        }
        
        
        
        Annotation newAnnotation = new Annotation()
        {
            Id = Guid.NewGuid(),
            LyricsId = annotation.LyricsId,
            UserId = annotation.UserId,
            From = annotation.From,
            To = annotation.To,
            Text = annotation.Text,
            CreatedAt = DateTime.UtcNow
        };
        
        await context.Annotations.AddAsync(newAnnotation, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return newAnnotation;
    }

    public async Task<List<Annotation>> GetUnverifiedAnnotations(CancellationToken cancellationToken = default)
    {
        return await context
            .Annotations
            .Where(a => a.IsVerified == false)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Annotation>> GetAnnotationsByLyricsId(Guid lyricsId, CancellationToken cancellationToken = default)
    {
        return await context
            .Annotations
            .Where(a => a.LyricsId == lyricsId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Annotation>> GetAnnotationsByUserId(Guid userId, CancellationToken cancellationToken = default)
    {
        return await context
            .Annotations
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Annotation> GetAnnotationById(Guid id, CancellationToken cancellationToken = default)
    {
        var annotation = await context
            .Annotations
            .FirstOrDefaultAsync(a => 
                a.Id == id, cancellationToken);
        
        if(annotation is null)
            throw new Exception("Annotation not found");
        
        return annotation;
    }

    public async Task VerifyAnnotation(Guid id, CancellationToken cancellationToken = default)
    {
        var annotation = await GetAnnotationById(id, cancellationToken);
        
        annotation.IsVerified = true;
        annotation.IsRejected = false;
        
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RejectAnnotation(Guid id, CancellationToken cancellationToken = default)
    {
        var annotation = await GetAnnotationById(id, cancellationToken);
        
        annotation.IsRejected = true;
        annotation.IsVerified = false;
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAnnotation(Guid id, CancellationToken cancellationToken = default)
    {
        var annotation = await GetAnnotationById(id, cancellationToken);
        context.Annotations.Remove(annotation);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Annotation> UpdateAnnotation(Guid id, UpdateAnnotationRequest annotation, CancellationToken cancellationToken = default)
    {
        var annotationToUpdate = await GetAnnotationById(id, cancellationToken);
        
        annotationToUpdate.Text = annotation.Text ?? annotationToUpdate.Text;
        annotationToUpdate.LyricsId = annotation.LyricsId ?? annotationToUpdate.LyricsId;
        annotationToUpdate.UserId = annotation.UserId ?? annotationToUpdate.UserId;
        annotationToUpdate.From = annotation.From ?? annotationToUpdate.From;
        annotationToUpdate.To = annotation.To ?? annotationToUpdate.To;
        annotationToUpdate.UpdatedAt = DateTime.UtcNow;
        
        await context.SaveChangesAsync(cancellationToken);
        return annotationToUpdate;
    }
}