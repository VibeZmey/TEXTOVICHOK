using WebApi.Interfaces;
using WebApi.Interfaces.Services;

namespace WebApi.Services;
using Minio;
using Minio.DataModel.Args;


public class S3Service : IS3Service
    {
        private readonly IMinioClient _minioClient;
        private readonly string _bucketName;

        public S3Service(IConfiguration configuration)
        {
            var endpoint = configuration["MinIO:Endpoint"];
            var accessKey = configuration["MinIO:AccessKey"];
            var secretKey = configuration["MinIO:SecretKey"];
            _bucketName = configuration["MinIO:BucketName"] ?? "images";
            _minioClient = new MinioClient()
                .WithEndpoint(endpoint)
                .WithCredentials(accessKey, secretKey)
                .Build();
        }

        public async Task UploadFileAsync(IFormFile image, string id)
        {
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if(!allowedTypes.Contains(image.ContentType)) 
                throw  new Exception("Image is not allowed");
            
            await using var stream = image.OpenReadStream();
            
            var bucketExists = await _minioClient.BucketExistsAsync(
                new BucketExistsArgs(). WithBucket(_bucketName));
            
            if (!bucketExists)
            {
                await _minioClient.MakeBucketAsync(
                    new MakeBucketArgs().WithBucket(_bucketName));
            }
            
            await _minioClient.PutObjectAsync(new PutObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(id)
                .WithStreamData(stream)
                .WithObjectSize(stream.Length)
                .WithContentType(image.ContentType));
        }

        public async Task<Stream> GetFileStreamAsync(string objectName)
        {
            var memoryStream = new MemoryStream();

            await _minioClient.GetObjectAsync(new GetObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName)
                .WithCallbackStream((stream) =>
                {
                    stream.CopyTo(memoryStream);
                }));

            memoryStream.Position = 0;
            return memoryStream;
        }

        public async Task DeleteFileAsync(string objectName)
        {
            await _minioClient.RemoveObjectAsync(new RemoveObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName));
        }
    }
