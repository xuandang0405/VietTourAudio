using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Interfaces;
using VietTourAudio.Api.Middlewares;
using VietTourAudio.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

var dataProtectionPath = Path.Combine(builder.Environment.ContentRootPath, ".data-protection-keys");
Directory.CreateDirectory(dataProtectionPath);
builder.Services
  .AddDataProtection()
  .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath))
  .SetApplicationName("VietTourAudio.Api");

var allowedOrigins = builder.Configuration
  .GetSection("Cors:AllowedOrigins")
  .Get<string[]>() ?? ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"];

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
  ?? "server=localhost;port=3306;database=viettuoraudio;user=root;password=;SslMode=None;AllowPublicKeyRetrieval=True;";

builder.Services.AddDbContext<AppDbContext>(options =>
{
  options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 36)));
});

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IStallService, DatabaseStallService>();
builder.Services.AddScoped<IPoiService, DatabasePoiService>();
builder.Services.AddScoped<IPoiContentService, DatabasePoiContentService>();
builder.Services.AddScoped<IMediaStorageService, DatabaseMediaStorageService>();
builder.Services.AddScoped<DatabaseTrackingService>();
builder.Services.AddScoped<IQrTrackingService>(services => services.GetRequiredService<DatabaseTrackingService>());
builder.Services.AddScoped<IAnalyticsService>(services => services.GetRequiredService<DatabaseTrackingService>());
builder.Services.AddScoped<IPaymentService, DatabasePaymentService>();
builder.Services.AddScoped<ICommissionService, CommissionService>();
builder.Services.AddScoped<IAdminLogService, AdminLogService>();
builder.Services.AddScoped<IGeofenceService, GeofenceService>();
builder.Services.AddSingleton<PrototypeAnalyticsState>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
  options.SwaggerDoc("v1", new OpenApiInfo
  {
    Title = "VietTourAudio API",
    Version = "v1",
    Description = "API scaffold cho web app/PWA thuyết minh du lịch tự động theo GPS, QR và audio đa ngôn ngữ."
  });

  options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
  {
    Name = "Authorization",
    Type = SecuritySchemeType.Http,
    Scheme = "bearer",
    BearerFormat = "JWT",
    In = ParameterLocation.Header,
    Description = "Nhập JWT Bearer token."
  });

  options.AddSecurityRequirement(new OpenApiSecurityRequirement
  {
    {
      new OpenApiSecurityScheme
      {
        Reference = new OpenApiReference
        {
          Type = ReferenceType.SecurityScheme,
          Id = "Bearer"
        }
      },
      Array.Empty<string>()
    }
  });
});

builder.Services.AddCors(options =>
{
  options.AddPolicy("ClientApp", policy =>
  {
    policy
      .WithOrigins(allowedOrigins)
      .AllowAnyHeader()
      .AllowAnyMethod();
  });
});

var jwtKey = builder.Configuration["Jwt:Key"]
  ?? "VietTourAudio-Development-Jwt-Key-Change-Me-At-Least-32-Chars";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
  .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options =>
  {
    options.TokenValidationParameters = new TokenValidationParameters
    {
      ValidateIssuer = true,
      ValidateAudience = true,
      ValidateLifetime = true,
      ValidateIssuerSigningKey = true,
      ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "VietTourAudio",
      ValidAudience = builder.Configuration["Jwt:Audience"] ?? "VietTourAudioClient",
      IssuerSigningKey = signingKey,
      ClockSkew = TimeSpan.FromMinutes(2)
    };
  });

var app = builder.Build();

var uploadsPath = Path.GetFullPath(Path.Combine(
  app.Environment.ContentRootPath,
  app.Configuration["Storage:BasePath"] ?? "../uploads"
));
Directory.CreateDirectory(uploadsPath);

app.UseMiddleware<ErrorHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
  app.UseHttpsRedirection();
}
app.UseStaticFiles(new StaticFileOptions
{
  FileProvider = new PhysicalFileProvider(uploadsPath),
  RequestPath = "/uploads"
});
app.UseCors("ClientApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", async (AppDbContext db) =>
{
  try
  {
    var connection = await DatabaseSql.OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    command.CommandText = "SELECT 1";
    await command.ExecuteScalarAsync();
    return Results.Ok(new { ok = true, database = "connected" });
  }
  catch (Exception error)
  {
    return Results.Json(new { ok = false, database = "disconnected", error = error.Message }, statusCode: 503);
  }
});

app.Run();
