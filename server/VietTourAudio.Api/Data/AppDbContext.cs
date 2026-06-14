using Microsoft.EntityFrameworkCore;

namespace VietTourAudio.Api.Data;

public class AppDbContext : DbContext
{
  public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
  {
  }

  // The canonical schema is maintained in database/schema.sql. Services use
  // parameterized SQL so the .NET API and Node admin API share that schema.
}
