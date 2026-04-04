using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace WebApi.Persistence.Models;

public class Album
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public string? Genre { get; set; }
    public Guid UserId { get; set; }
    [JsonIgnore]
    public User User { get; set; }
    
    public string? ImageUrl { get; set; }
    public int Year { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    [JsonIgnore]
    public List<Lyrics> Lyrics { get; set; }
}