using System;
using System.Data.Common;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Interfaces;
using VietTourAudio.Api.Middlewares;
using VietTourAudio.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = builder.Configuration
  .GetSection("Cors:AllowedOrigins")
  .Get<string[]>() ?? ["http://localhost:5173"];

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
  ?? "server=localhost;port=3306;database=viettuoraudio;user=root;password=your_password;";

builder.Services.AddDbContext<AppDbContext>(options =>
{
  options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 36)));
});

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IStallService, StallService>();
builder.Services.AddScoped<IPoiService, PoiService>();
builder.Services.AddScoped<IPoiContentService, PoiContentService>();
builder.Services.AddScoped<IMediaStorageService, MediaStorageService>();
builder.Services.AddScoped<IQrTrackingService, QrTrackingService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<ICommissionService, CommissionService>();
builder.Services.AddScoped<IAdminLogService, AdminLogService>();
builder.Services.AddScoped<IGeofenceService, GeofenceService>();

builder.Services.AddHttpContextAccessor();
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

builder.Services.AddAuthorizationBuilder()
  .AddPolicy("AdminOnly", policy => policy.RequireRole("ADMIN"))
  .AddPolicy("StallOwnerOnly", policy => policy.RequireRole("STALL_OWNER"))
  .AddPolicy("TouristOnly", policy => policy.RequireRole("TOURIST"))
  .AddPolicy("StallOwnerOrAdmin", policy => policy.RequireRole("STALL_OWNER", "ADMIN"))
  .AddPolicy("AnyRole", policy => policy.RequireRole("ADMIN", "STALL_OWNER", "TOURIST"));

var app = builder.Build();

app.UseMiddleware<ErrorHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("ClientApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seed database with demo data and ensure required schema is available when running locally
using (var scope = app.Services.CreateScope())
{
  var services = scope.ServiceProvider;
  try
  {
    var db = services.GetRequiredService<AppDbContext>();
    var connection = db.Database.GetDbConnection();
    try
    {
      connection.Open();
      using var columnCheck = connection.CreateCommand();
      columnCheck.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'premium_expires_at';";
      var existsValue = columnCheck.ExecuteScalar();
      if (existsValue is not null && Convert.ToInt32(existsValue) == 0)
      {
        using var alter = connection.CreateCommand();
        alter.CommandText = "ALTER TABLE `users` ADD COLUMN `premium_expires_at` datetime(6) NULL;";
        alter.ExecuteNonQuery();
      }
    }
    finally
    {
      connection.Close();
    }

    VietTourAudio.Api.Data.DbSeeder.SeedAsync(db).GetAwaiter().GetResult();
  }
  catch
  {
    // ignore seeding/schema patching errors during startup
  }
}

app.Run();
