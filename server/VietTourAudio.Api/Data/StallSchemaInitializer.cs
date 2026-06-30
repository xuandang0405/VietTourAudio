using System.Threading.Tasks;

namespace VietTourAudio.Api.Data;

public static class StallSchemaInitializer
{
  public static Task InitializeAsync(AppDbContext db)
  {
    // Schema is initialized from database/schema.sql and database/seed.sql directly.
    return Task.CompletedTask;
  }
}
