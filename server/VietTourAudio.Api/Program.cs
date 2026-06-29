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
using VietTourAudio.Api.Infrastructure;
using System.Globalization;
using System.Text.Json;

if (args.Contains("--validate-langs"))
{
  Console.WriteLine("=== STARTING TRANSLATION LANGUAGES VALIDATION ===");
  var localesPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "client", "src", "locales"));
  if (!Directory.Exists(localesPath))
  {
    localesPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "client", "src", "locales"));
  }
  if (!Directory.Exists(localesPath))
  {
    localesPath = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "client", "src", "locales"));
  }

  if (!Directory.Exists(localesPath))
  {
    Console.Error.WriteLine($"Error: Locales directory not found: {localesPath}");
    Environment.Exit(1);
  }

  var files = Directory.GetFiles(localesPath, "*.json");
  var allKeys = new Dictionary<string, HashSet<string>>();
  var success = true;

  foreach (var file in files)
  {
    var fileName = Path.GetFileName(file);
    try
    {
      var content = File.ReadAllText(file);
      using var doc = JsonDocument.Parse(content);
      var keys = new HashSet<string>();
      GetKeysRecursive(doc.RootElement, "", keys);
      allKeys[fileName] = keys;
      Console.WriteLine($"Parsed {fileName}: {keys.Count} keys found.");
    }
    catch (Exception ex)
    {
      Console.Error.WriteLine($"Error parsing {fileName}: {ex.Message}");
      success = false;
    }
  }

  if (success && allKeys.Count > 1)
  {
    var allFiles = allKeys.Keys.ToList();
    for (int i = 0; i < allFiles.Count; i++)
    {
      for (int j = i + 1; j < allFiles.Count; j++)
      {
        var fileA = allFiles[i];
        var fileB = allFiles[j];
        var keysA = allKeys[fileA];
        var keysB = allKeys[fileB];

        var onlyInA = keysA.Except(keysB).ToList();
        var onlyInB = keysB.Except(keysA).ToList();

        if (onlyInA.Any())
        {
          Console.Error.WriteLine($"Keys present in {fileA} but missing in {fileB}:");
          foreach (var key in onlyInA) Console.Error.WriteLine($"  - {key}");
          success = false;
        }

        if (onlyInB.Any())
        {
          Console.Error.WriteLine($"Keys present in {fileB} but missing in {fileA}:");
          foreach (var key in onlyInB) Console.Error.WriteLine($"  - {key}");
          success = false;
        }
      }
    }
  }

  if (success)
  {
    Console.WriteLine("SUCCESS: All translation keys are fully aligned and consistent across all language files!");
    Environment.Exit(0);
  }
  else
  {
    Console.Error.WriteLine("FAILED: Translation files have missing or inconsistent keys.");
    Environment.Exit(1);
  }
}

static void GetKeysRecursive(JsonElement element, string prefix, HashSet<string> keys)
{
  if (element.ValueKind == JsonValueKind.Object)
  {
    foreach (var prop in element.EnumerateObject())
    {
      var newPrefix = string.IsNullOrEmpty(prefix) ? prop.Name : $"{prefix}.{prop.Name}";
      GetKeysRecursive(prop.Value, newPrefix, keys);
    }
  }
  else
  {
    keys.Add(prefix);
  }
}

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
  .Get<string[]>() ?? ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175", "http://localhost:5176", "http://127.0.0.1:5176", "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"];

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
  ?? "server=localhost;port=3306;database=viettuoraudio;user=root;password=;SslMode=None;AllowPublicKeyRetrieval=True;GuidFormat=None;";

if (!connectionString.Contains("GuidFormat=", StringComparison.OrdinalIgnoreCase))
{
  connectionString = connectionString.TrimEnd(';') + ";GuidFormat=None;";
}

builder.Services.AddDbContext<AppDbContext>(options => options.UseMySql(connectionString, ServerVersion.Parse("10.4.32-mariadb")));

builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient(string.Empty)
  .ConfigurePrimaryHttpMessageHandler(() => new System.Net.Http.HttpClientHandler
  {
    ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true
  });
builder.Services.AddHostedService<MonthlyBillingWorker>();
builder.Services.AddScoped<IAuthService, DatabaseIdentityService>();
builder.Services.AddScoped<IUserService, DatabaseUserService>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
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
builder.Services.AddScoped<PaymentEntitlementService>();
builder.Services.AddScoped<VietTourAudio.Api.Services.PoiTranslationService>();
builder.Services.AddSingleton<PrototypeAnalyticsState>();

builder.Services.AddSignalR();

builder.Services.AddControllers()
  .AddJsonOptions(options => {
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
  });
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
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
  options.AddPolicy("AllowReactClients", policy =>
  {
    policy
      .WithOrigins(allowedOrigins)
      .AllowAnyHeader()
      .AllowAnyMethod()
      .AllowCredentials();
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
var supportedCultures = new[] { "vi", "en", "ja", "ko", "zh" }.Select(x => new CultureInfo(x)).ToArray();

using (var schemaScope = app.Services.CreateScope())
{
  var schemaDb = schemaScope.ServiceProvider.GetRequiredService<AppDbContext>();
  await PaymentSchemaInitializer.InitializeAsync(schemaDb);
  await StallSchemaInitializer.InitializeAsync(schemaDb);
}

var uploadsPath = Path.GetFullPath(Path.Combine(
  app.Environment.ContentRootPath,
  app.Configuration["Storage:BasePath"] ?? "../uploads"
));
Directory.CreateDirectory(uploadsPath);
Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads"));

app.UseRequestLocalization(new RequestLocalizationOptions
{
  DefaultRequestCulture = new Microsoft.AspNetCore.Localization.RequestCulture("vi"),
  SupportedCultures = supportedCultures,
  SupportedUICultures = supportedCultures
});
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

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
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowReactClients");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<PremiumExpiryMiddleware>();
app.MapHub<VietTourAudio.Api.Hubs.NotificationHub>("/hub/notifications");
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
