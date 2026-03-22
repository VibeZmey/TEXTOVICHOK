using WebApi.DTO;
using WebApi.Persistence.Models;

namespace WebApi.Interfaces.Repositories;

public interface IAnnotationRepository
{
    Task<Annotation> CreateAnnotation(CreateAnnotationRequest annotation, CancellationToken cancellationToken = default);
    Task<List<Annotation>> GetUnverifiedAnnotations(CancellationToken cancellationToken = default);
    Task<List<Annotation>> GetAnnotationsByLyricsId(Guid lyricsId, CancellationToken cancellationToken = default);
    Task<List<Annotation>> GetAnnotationsByUserId(Guid userId, CancellationToken cancellationToken = default);
    Task<Annotation> GetAnnotationById(Guid id, CancellationToken cancellationToken = default);
    Task VerifyAnnotation(Guid id, CancellationToken cancellationToken = default);
    Task DeleteAnnotation(Guid id, CancellationToken cancellationToken = default);
    Task<Annotation> UpdateAnnotation(Guid id, UpdateAnnotationRequest annotation,CancellationToken cancellationToken = default);
    Task RejectAnnotation(Guid id, CancellationToken cancellationToken = default);
}