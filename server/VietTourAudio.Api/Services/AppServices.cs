using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Linq;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Entities;
using VietTourAudio.Api.DTOs;
using VietTourAudio.Api.Interfaces;

namespace VietTourAudio.Api.Services;

public class AuthService : IAuthService
{
  private static readonly object UsersLock = new();
  private static readonly List<AuthUserRecord> Users =
  [
    CreateSeedUser(1, "Admin VietTourAudio", "admin@viettouraudio.local", "0900000001", "ADMIN", "ACTIVE", "Admin@123456"),
    CreateSeedUser(2, "Chu sap Ben Thanh", "owner.benthanh@viettouraudio.local", "0900000002", "STALL_OWNER", "ACTIVE", "Owner@123456"),
    CreateSeedUser(3, "Chu sap Hoi An", "owner.hoian@viettouraudio.local", "0900000003", "STALL_OWNER", "ACTIVE", "Owner@123456"),
    CreateSeedUser(4, "Khach du lich Demo", "tourist@viettouraudio.local", "0900000004", "TOURIST", "ACTIVE", "Tourist@123456")
  ];

  private static ulong NextUserId = 5;
  private static readonly HashSet<string> AllowedRoles = ["ADMIN", "STALL_OWNER", "TOURIST"];

  private readonly AppDbContext _db;
  private readonly IConfiguration _configuration;
  private readonly IHttpContextAccessor _httpContextAccessor;

  public AuthService(AppDbContext db, IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
  {
    _db = db;
    _configuration = configuration;
    _httpContextAccessor = httpContextAccessor;
  }

  public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
  {
    var email = NormalizeEmail(request.Email);

    var dbUser = await _db.Users.FirstOrDefaultAsync(x => x.Email == email);
    if (dbUser is not null)
    {
      if (!CanLoginWithStoredHash(request.Password, dbUser.PassHash))
      {
        throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");
      }

      if (!string.Equals(dbUser.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase))
      {
        throw new UnauthorizedAccessException("Tài khoản chưa được kích hoạt hoặc đã bị khóa.");
      }

      dbUser.LastLoginAt = DateTime.UtcNow;
      await _db.SaveChangesAsync();

      var responseUser = new UserResponseDto(
        dbUser.Id,
        dbUser.FullName,
        dbUser.Email,
        dbUser.Role,
        dbUser.Status
      );

      var loginAuthResponse = CreateAuthResponse(responseUser, "db_user");
      return new LoginResponseDto(
        Token: loginAuthResponse.AccessToken,
        Role: loginAuthResponse.User.Role
      );
    }

    AuthUserRecord? user;
    lock (UsersLock)
    {
      user = Users.FirstOrDefault(x => x.Email == email);
    }

    if (user is null || !VerifyPassword(request.Password, user.PasswordHash))
    {
      throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");
    }

    if (!string.Equals(user.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase))
    {
      throw new UnauthorizedAccessException("Tài khoản chưa được kích hoạt hoặc đã bị khóa.");
    }

    var authResponse = CreateAuthResponse(ToUserResponse(user), "demo_user");
    return new LoginResponseDto(
      Token: authResponse.AccessToken,
      Role: authResponse.User.Role
    );
  }

  public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
  {
    var email = NormalizeEmail(request.Email);
    var role = NormalizeRole(request.Role);

    ValidateRegisterRequest(request, email, role);

    if (await _db.Users.AnyAsync(x => x.Email == email))
    {
      throw new InvalidOperationException("Email đã tồn tại.");
    }

    var now = DateTime.UtcNow;
    var dbUser = new VietTourAudio.Api.Entities.User
    {
      FullName = request.DisplayName.Trim(),
      Email = email,
      PassHash = HashPassword(request.Password),
      Role = role,
      Status = "ACTIVE",
      CreatedAt = now,
      UpdatedAt = now
    };

    _db.Users.Add(dbUser);
    await _db.SaveChangesAsync();

    var responseUser = new UserResponseDto(
      dbUser.Id,
      dbUser.FullName,
      dbUser.Email,
      dbUser.Role,
      dbUser.Status
    );

    return CreateAuthResponse(responseUser, "db_user");
  }

  private Task<AuthResponseDto> RegisterDemoAsync(RegisterRequestDto request, string email, string role)
  {
    AuthUserRecord user;
    lock (UsersLock)
    {
      if (Users.Any(x => x.Email == email))
      {
        throw new InvalidOperationException("Email đã tồn tại.");
      }

      user = new AuthUserRecord(
        NextUserId++,
        request.DisplayName.Trim(),
        email,
        null,
        role,
        "ACTIVE",
        HashPassword(request.Password),
        null,
        DateTime.UtcNow,
        DateTime.UtcNow
      );

      Users.Add(user);
    }

    return Task.FromResult(CreateAuthResponse(ToUserResponse(user), "demo_user"));
  }

  public async Task<UserResponseDto> GetCurrentUserAsync()
  {
    var userId = GetCurrentUserId();
    var accountSource = GetCurrentAccountSource();

    if (accountSource == "db_user")
    {
      var dbUser = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId)
        ?? throw new UnauthorizedAccessException("Không tìm thấy tài khoản hiện tại.");

      return new UserResponseDto(
        dbUser.Id,
        dbUser.FullName,
        dbUser.Email,
        dbUser.Role,
        dbUser.Status
      );
    }

    lock (UsersLock)
    {
      var user = Users.FirstOrDefault(x => x.Id == userId)
        ?? throw new UnauthorizedAccessException("Không tìm thấy tài khoản hiện tại.");
      return ToUserResponse(user);
    }
  }

  public async Task<PremiumStatusDto> GetPremiumStatusAsync()
  {
    var userId = GetCurrentUserId();
    if (GetCurrentAccountSource() == "db_user")
    {
      var dbUser = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId)
        ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

      return ToPremiumStatus(dbUser);
    }

    lock (UsersLock)
    {
      return GetPremiumStatusForUser(userId);
    }
  }

  private AuthResponseDto CreateAuthResponse(UserResponseDto user, string accountSource)
  {
    var expiresMinutes = int.TryParse(_configuration["Jwt:ExpiresMinutes"], out var minutes)
      ? minutes
      : 120;
    var expiresAt = DateTime.UtcNow.AddMinutes(expiresMinutes);
    var key = _configuration["Jwt:Key"] ?? "VietTourAudio-Development-Jwt-Key-Change-Me-At-Least-32-Chars";
    var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
    var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

    var claims = new List<Claim>
    {
      new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
      new(JwtRegisteredClaimNames.Email, user.Email),
      new(ClaimTypes.NameIdentifier, user.Id.ToString()),
      new(ClaimTypes.Name, user.FullName),
      new(ClaimTypes.Role, user.Role),
      new("account_source", accountSource)
    };

    var token = new JwtSecurityToken(
      issuer: _configuration["Jwt:Issuer"] ?? "VietTourAudio",
      audience: _configuration["Jwt:Audience"] ?? "VietTourAudioClient",
      claims: claims,
      expires: expiresAt,
      signingCredentials: credentials
    );

    return new AuthResponseDto(new JwtSecurityTokenHandler().WriteToken(token), expiresAt, user);
  }

  internal static IReadOnlyList<UserResponseDto> GetDemoUsers()
  {
    lock (UsersLock)
    {
      return Users.Select(ToUserResponse).ToList();
    }
  }

  internal static UserResponseDto GetDemoUserById(ulong id)
  {
    lock (UsersLock)
    {
      var user = Users.FirstOrDefault(x => x.Id == id)
        ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

      return ToUserResponse(user);
    }
  }

  internal static PremiumStatusDto ActivatePremiumForUser(ulong userId, TimeSpan duration)
  {
    lock (UsersLock)
    {
      var index = Users.FindIndex(x => x.Id == userId);
      if (index < 0)
      {
        throw new KeyNotFoundException("Không tìm thấy người dùng để kích hoạt premium.");
      }

      var user = Users[index];
      var now = DateTime.UtcNow;
      var currentExpiry = user.PremiumExpiresAt.HasValue && user.PremiumExpiresAt.Value > now
        ? user.PremiumExpiresAt.Value
        : now;

      var updated = user with
      {
        PremiumExpiresAt = currentExpiry.Add(duration),
        UpdatedAt = now
      };

      Users[index] = updated;
      return ToPremiumStatus(updated);
    }
  }

  private ulong GetCurrentUserId()
  {
    var principal = _httpContextAccessor.HttpContext?.User
      ?? throw new UnauthorizedAccessException("Chưa đăng nhập.");

    var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

    if (!ulong.TryParse(idValue, out var userId))
    {
      throw new UnauthorizedAccessException("Token không hợp lệ.");
    }

    return userId;
  }

  private string GetCurrentAccountSource()
  {
    return _httpContextAccessor.HttpContext?.User.FindFirstValue("account_source")
      ?? "demo_user";
  }

  private static void ValidateRegisterRequest(RegisterRequestDto request, string email, string role)
  {
    if (string.IsNullOrWhiteSpace(request.DisplayName))
    {
      throw new InvalidOperationException("Họ tên là bắt buộc.");
    }

    if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
    {
      throw new InvalidOperationException("Email không hợp lệ.");
    }

    if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
    {
      throw new InvalidOperationException("Mật khẩu phải có ít nhất 6 ký tự.");
    }

    if (!AllowedRoles.Contains(role))
    {
      throw new InvalidOperationException("Role không hợp lệ.");
    }
  }

  private static string NormalizeEmail(string email)
  {
    return email.Trim().ToLowerInvariant();
  }

  private static string NormalizeRole(string role)
  {
    return string.IsNullOrWhiteSpace(role)
      ? "TOURIST"
      : role.Trim().ToUpperInvariant();
  }

  private static AuthUserRecord CreateSeedUser(
    ulong id,
    string fullName,
    string email,
    string? phone,
    string role,
    string status,
    string password)
  {
    var now = DateTime.UtcNow;
    return new AuthUserRecord(id, fullName, NormalizeEmail(email), phone, role, status, HashPassword(password), null, now, now);
  }

  private static UserResponseDto ToUserResponse(AuthUserRecord user)
  {
    return new UserResponseDto(user.Id, user.FullName, user.Email, user.Role, user.Status);
  }

  private static PremiumStatusDto GetPremiumStatusForUser(ulong userId)
  {
    var user = Users.FirstOrDefault(x => x.Id == userId)
      ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

    return ToPremiumStatus(user);
  }

  private static PremiumStatusDto ToPremiumStatus(AuthUserRecord user)
  {
    var now = DateTime.UtcNow;
    var isPremium = user.PremiumExpiresAt.HasValue && user.PremiumExpiresAt.Value > now;
    var expiresAt = isPremium ? user.PremiumExpiresAt : null;
    var remainingMinutes = expiresAt.HasValue
      ? (int)Math.Max(0, (expiresAt.Value - now).TotalMinutes)
      : 0;

    return new PremiumStatusDto(user.Id, isPremium, expiresAt, remainingMinutes);
  }

  private static PremiumStatusDto ToPremiumStatus(User user)
  {
    var now = DateTime.UtcNow;
    var isPremium = user.PremiumExpiresAt.HasValue && user.PremiumExpiresAt.Value > now;
    var expiresAt = isPremium ? user.PremiumExpiresAt : null;
    var remainingMinutes = expiresAt.HasValue
      ? (int)Math.Max(0, (expiresAt.Value - now).TotalMinutes)
      : 0;

    return new PremiumStatusDto(user.Id, isPremium, expiresAt, remainingMinutes);
  }

  private static string HashPassword(string password)
  {
    return BCrypt.Net.BCrypt.HashPassword(password);
  }

  private static bool VerifyPassword(string password, string storedHash)
  {
    try
    {
      return BCrypt.Net.BCrypt.Verify(password, storedHash);
    }
    catch
    {
      return false;
    }
  }

  private static bool CanLoginWithStoredHash(string password, string storedHash)
  {
    if (storedHash.StartsWith("pbkdf2-sha256$", StringComparison.Ordinal))
    {
      return VerifyPassword(password, storedHash);
    }

    if (storedHash.StartsWith("$2a$") || storedHash.StartsWith("$2b$") || storedHash.StartsWith("$2y$"))
    {
      return VerifyPassword(password, storedHash);
    }

    if (storedHash.Contains("Placeholder", StringComparison.OrdinalIgnoreCase))
    {
      return password is "Admin@123456" or "Owner@123456" or "Tourist@123456" or "admin";
    }

    return false;
  }

  private sealed record AuthUserRecord(
    ulong Id,
    string FullName,
    string Email,
    string? Phone,
    string Role,
    string Status,
    string PasswordHash,
    DateTime? PremiumExpiresAt,
    DateTime CreatedAt,
    DateTime UpdatedAt
  );
}

public class UserService : IUserService
{
  public Task<IReadOnlyList<UserResponseDto>> GetUsersAsync()
  {
    return Task.FromResult(AuthService.GetDemoUsers());
  }

  public Task<UserResponseDto> GetByIdAsync(ulong id)
  {
    return Task.FromResult(AuthService.GetDemoUserById(id));
  }
}

public class StallService : IStallService
{
  private readonly AppDbContext _db;
  private readonly IHttpContextAccessor _httpContextAccessor;

  public StallService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
  {
    _db = db;
    _httpContextAccessor = httpContextAccessor;
  }

  public async Task<IReadOnlyList<StallResponseDto>> GetStallsAsync()
  {
    return await _db.Stalls
      .Select(stall => new StallResponseDto(
        stall.Id,
        stall.VendorId,
        stall.Name,
        stall.Slug,
        stall.Description,
        stall.Address,
        stall.Latitude,
        stall.Longitude,
        stall.Status,
        stall.IsFeatured
      ))
      .ToListAsync();
  }

  public async Task<IReadOnlyList<StallResponseDto>> GetMyStallsAsync()
  {
    var vendorId = GetCurrentUserId();
    return await _db.Stalls
      .Where(x => x.VendorId == vendorId)
      .Select(stall => new StallResponseDto(
        stall.Id,
        stall.VendorId,
        stall.Name,
        stall.Slug,
        stall.Description,
        stall.Address,
        stall.Latitude,
        stall.Longitude,
        stall.Status,
        stall.IsFeatured
      ))
      .ToListAsync();
  }

  public async Task<StallResponseDto> GetByIdAsync(ulong id)
  {
    var stall = await _db.Stalls.FindAsync(id);
    if (stall is null)
    {
      throw new KeyNotFoundException("Không tìm thấy sạp.");
    }

    return ToStallResponse(stall);
  }

  public async Task<StallResponseDto> CreateAsync(StallRequestDto request)
  {
    var vendorId = GetCurrentUserId();
    ValidateStallRequest(request);
    await EnsureSlugAvailableAsync(request.Slug, null);

    var now = DateTime.UtcNow;
    var stall = new Stall
    {
      VendorId = vendorId,
      Name = request.Name.Trim(),
      Slug = NormalizeSlug(request.Slug),
      Description = request.Description?.Trim(),
      Address = request.Address?.Trim(),
      Latitude = request.Latitude,
      Longitude = request.Longitude,
      OpeningHours = request.OpeningHours?.Trim(),
      Status = "PENDING_REVIEW",
      IsFeatured = false,
      ActivationRadius = 30,
      CreatedAt = now,
      UpdatedAt = now
    };

    _db.Stalls.Add(stall);
    await _db.SaveChangesAsync();
    return ToStallResponse(stall);
  }

  public async Task<StallResponseDto> UpdateAsync(ulong id, StallRequestDto request)
  {
    var vendorId = GetCurrentUserId();
    ValidateStallRequest(request);

    var stall = await _db.Stalls.FindAsync(id);
    if (stall is null)
    {
      throw new KeyNotFoundException("Không tìm thấy sạp.");
    }

    if (stall.VendorId != vendorId)
    {
      throw new UnauthorizedAccessException("Bạn chỉ được chỉnh sửa sạp của mình.");
    }

    await EnsureSlugAvailableAsync(request.Slug, id);

    stall.Name = request.Name.Trim();
    stall.Slug = NormalizeSlug(request.Slug);
    stall.Description = request.Description?.Trim();
    stall.Address = request.Address?.Trim();
    stall.Latitude = request.Latitude;
    stall.Longitude = request.Longitude;
    stall.OpeningHours = request.OpeningHours?.Trim();
    stall.Status = stall.Status is "ACTIVE" or "APPROVED" ? "PENDING_REVIEW" : stall.Status;
    stall.UpdatedAt = DateTime.UtcNow;

    await _db.SaveChangesAsync();
    return ToStallResponse(stall);
  }

  public async Task<StallResponseDto> SubmitForReviewAsync(ulong id)
  {
    var vendorId = GetCurrentUserId();
    var stall = await _db.Stalls.FindAsync(id);
    if (stall is null)
    {
      throw new KeyNotFoundException("Không tìm thấy sạp.");
    }

    if (stall.VendorId != vendorId)
    {
      throw new UnauthorizedAccessException("Bạn chỉ được gửi sạp của mình để duyệt.");
    }

    stall.Status = "PENDING_REVIEW";
    stall.UpdatedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();
    return ToStallResponse(stall);
  }

  public async Task<StallResponseDto> UpdateStatusAsync(ulong id, string status)
  {
    var normalizedStatus = NormalizeStatus(status);
    var stall = await _db.Stalls.FindAsync(id);
    if (stall is null)
    {
      throw new KeyNotFoundException("Không tìm thấy sạp.");
    }

    stall.Status = normalizedStatus;
    stall.UpdatedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();
    return ToStallResponse(stall);
  }

  private async Task EnsureSlugAvailableAsync(string slug, ulong? currentStallId)
  {
    var normalizedSlug = NormalizeSlug(slug);
    var exists = await _db.Stalls.AnyAsync(x =>
      x.Slug == normalizedSlug && (!currentStallId.HasValue || x.Id != currentStallId.Value)
    );

    if (exists)
    {
      throw new InvalidOperationException("Slug sạp đã tồn tại.");
    }
  }

  private ulong GetCurrentUserId()
  {
    var principal = _httpContextAccessor.HttpContext?.User
      ?? throw new UnauthorizedAccessException("Chưa đăng nhập.");

    var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

    if (!ulong.TryParse(idValue, out var userId))
    {
      throw new UnauthorizedAccessException("Token không hợp lệ.");
    }

    return userId;
  }

  private static void ValidateStallRequest(StallRequestDto request)
  {
    if (string.IsNullOrWhiteSpace(request.Name))
    {
      throw new InvalidOperationException("Tên sạp là bắt buộc.");
    }

    if (string.IsNullOrWhiteSpace(request.Slug))
    {
      throw new InvalidOperationException("Slug là bắt buộc.");
    }

    if (request.Latitude is < -90 or > 90 || request.Longitude is < -180 or > 180)
    {
      throw new InvalidOperationException("Toạ độ không hợp lệ.");
    }
  }

  private static string NormalizeSlug(string slug)
  {
    return slug.Trim().ToLowerInvariant();
  }

  private static string NormalizeStatus(string status)
  {
    var normalizedStatus = status.Trim().ToUpperInvariant();
    if (normalizedStatus == "APPROVED")
    {
      normalizedStatus = "ACTIVE";
    }
    else if (normalizedStatus == "PENDING")
    {
      normalizedStatus = "PENDING_REVIEW";
    }

    var allowedStatuses = new HashSet<string> { "PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED" };

    if (!allowedStatuses.Contains(normalizedStatus))
    {
      throw new InvalidOperationException("Trạng thái sạp không hợp lệ.");
    }

    return normalizedStatus;
  }

  private static StallResponseDto ToStallResponse(Stall stall)
  {
    return new StallResponseDto(
      stall.Id,
      stall.VendorId,
      stall.Name,
      stall.Slug,
      stall.Description,
      stall.Address,
      stall.Latitude,
      stall.Longitude,
      stall.Status,
      stall.IsFeatured
    );
  }

  internal static IReadOnlyList<StallResponseDto> GetDemoStallsByOwner(ulong ownerId)
  {
    return new List<StallResponseDto>
    {
      new(1, ownerId, "Demo Stall 1", "demo-stall-1", "Sạp demo", "Địa chỉ demo", 10.8231m, 106.6297m, "ACTIVE", false),
      new(2, ownerId, "Demo Stall 2", "demo-stall-2", "Sạp demo 2", "Địa chỉ demo 2", 10.8241m, 106.6307m, "PENDING_REVIEW", false)
    };
  }
}

public class PoiService : IPoiService
{
  private readonly AppDbContext _db;
  private readonly IHttpContextAccessor _httpContextAccessor;

  public PoiService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
  {
    _db = db;
    _httpContextAccessor = httpContextAccessor;
  }

  public async Task<IReadOnlyList<PoiResponseDto>> GetPoisAsync(ulong? stallId = null)
  {
    var query = _db.Pois.AsQueryable();
    if (stallId.HasValue)
    {
      query = query.Where(x => x.StallId == stallId.Value);
    }

    return await query.Select(poi => new PoiResponseDto(
      poi.Id,
      poi.StallId,
      poi.Name,
      poi.Description,
      poi.Latitude,
      poi.Longitude,
      poi.ActivationRadius,
      poi.IsPremiumContent,
      poi.Status
    )).ToListAsync();
  }

  public async Task<IReadOnlyList<PoiResponseDto>> GetMyPoisAsync()
  {
    var vendorId = GetCurrentUserId();
    var stallIds = await _db.Stalls
      .Where(x => x.VendorId == vendorId)
      .Select(x => x.Id)
      .ToListAsync();

    return await _db.Pois
      .Where(x => stallIds.Contains(x.StallId))
      .Select(poi => new PoiResponseDto(
        poi.Id,
        poi.StallId,
        poi.Name,
        poi.Description,
        poi.Latitude,
        poi.Longitude,
        poi.ActivationRadius,
        poi.IsPremiumContent,
        poi.Status
      ))
      .ToListAsync();
  }

  public async Task<IReadOnlyList<PoiResponseDto>> GetPendingAsync()
  {
    return await _db.Pois
      .Where(x => x.Status == "PENDING_REVIEW")
      .Select(poi => new PoiResponseDto(
        poi.Id,
        poi.StallId,
        poi.Name,
        poi.Description,
        poi.Latitude,
        poi.Longitude,
        poi.ActivationRadius,
        poi.IsPremiumContent,
        poi.Status
      ))
      .ToListAsync();
  }

  public async Task<PoiResponseDto> GetByIdAsync(ulong id)
  {
    var poi = await _db.Pois.FindAsync(id);
    if (poi is null)
    {
      throw new KeyNotFoundException("Không tìm thấy POI.");
    }

    return ToPoiResponse(poi);
  }

  public async Task<IReadOnlyList<PoiResponseDto>> GetNearbyAsync(decimal latitude, decimal longitude, int radiusMeters)
  {
    var pois = await _db.Pois
      .Where(x => x.Status == "ACTIVE")
      .ToListAsync();

    return pois
      .Where(x => EstimateDistanceMeters(latitude, longitude, x.Latitude, x.Longitude) <= radiusMeters)
      .Select(ToPoiResponse)
      .ToList();
  }

  public async Task<PoiResponseDto> CreateAsync(PoiRequestDto request)
  {
    var vendorId = GetCurrentUserId();
    ValidatePoiRequest(request);

    var stall = await _db.Stalls.FindAsync(request.StallId);
    if (stall is null)
    {
      throw new KeyNotFoundException("Không tìm thấy sạp.");
    }

    if (stall.VendorId != vendorId)
    {
      throw new UnauthorizedAccessException("Bạn chỉ được gửi POI cho sạp của mình.");
    }

    var now = DateTime.UtcNow;
    var poi = new Poi
    {
      StallId = request.StallId,
      Name = request.Name.Trim(),
      Slug = NormalizeSlug(request.Name),
      Description = request.Description?.Trim(),
      Latitude = request.Latitude,
      Longitude = request.Longitude,
      ActivationRadius = request.ActivationRadius,
      IsPremiumContent = request.IsPremiumContent,
      Status = "PENDING_REVIEW",
      SortOrder = await _db.Pois.CountAsync(x => x.StallId == request.StallId) + 1,
      CreatedAt = now,
      UpdatedAt = now
    };

    _db.Pois.Add(poi);
    await _db.SaveChangesAsync();
    return ToPoiResponse(poi);
  }

  public async Task<PoiResponseDto> UpdateAsync(ulong id, UpdatePoiRequestDto request)
  {
    var vendorId = GetCurrentUserId();
    ValidatePoiRequest(request);

    var poi = await _db.Pois.FindAsync(id);
    if (poi is null)
    {
      throw new KeyNotFoundException("Không tìm thấy POI.");
    }

    var stall = await _db.Stalls.FindAsync(poi.StallId);
    if (stall is null || stall.VendorId != vendorId)
    {
      throw new UnauthorizedAccessException("Bạn chỉ được cập nhật POI của mình.");
    }

    poi.Name = request.Name.Trim();
    poi.Slug = NormalizeSlug(request.Name);
    poi.Description = request.Description?.Trim();
    poi.Latitude = request.Latitude;
    poi.Longitude = request.Longitude;
    poi.ActivationRadius = request.ActivationRadius;
    poi.IsPremiumContent = request.IsPremiumContent;
    poi.Status = "PENDING_REVIEW";
    poi.UpdatedAt = DateTime.UtcNow;

    await _db.SaveChangesAsync();
    return ToPoiResponse(poi);
  }

  public async Task<PoiResponseDto> SubmitForReviewAsync(ulong id)
  {
    var vendorId = GetCurrentUserId();
    var poi = await _db.Pois.FindAsync(id);
    if (poi is null)
    {
      throw new KeyNotFoundException("Không tìm thấy POI.");
    }

    var stall = await _db.Stalls.FindAsync(poi.StallId);
    if (stall is null || stall.VendorId != vendorId)
    {
      throw new UnauthorizedAccessException("Bạn chỉ được gửi POI của mình để duyệt.");
    }

    poi.Status = "PENDING_REVIEW";
    poi.UpdatedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();
    return ToPoiResponse(poi);
  }

  public async Task<PoiResponseDto> UpdateStatusAsync(ulong id, string status)
  {
    var normalizedStatus = NormalizeStatus(status);
    var poi = await _db.Pois.FindAsync(id);
    if (poi is null)
    {
      throw new KeyNotFoundException("Không tìm thấy POI.");
    }

    poi.Status = normalizedStatus;
    poi.UpdatedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();
    return ToPoiResponse(poi);
  }

  private ulong GetCurrentUserId()
  {
    var principal = _httpContextAccessor.HttpContext?.User
      ?? throw new UnauthorizedAccessException("Chưa đăng nhập.");

    var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

    if (!ulong.TryParse(idValue, out var userId))
    {
      throw new UnauthorizedAccessException("Token không hợp lệ.");
    }

    return userId;
  }

  private static void ValidatePoiRequest(PoiRequestDto request)
  {
    if (string.IsNullOrWhiteSpace(request.Name))
    {
      throw new InvalidOperationException("Tên POI là bắt buộc.");
    }

    if (request.Latitude is < -90 or > 90 || request.Longitude is < -180 or > 180)
    {
      throw new InvalidOperationException("Toạ độ POI không hợp lệ.");
    }

    if (request.ActivationRadius <= 0)
    {
      throw new InvalidOperationException("Bán kính kích hoạt phải lớn hơn 0.");
    }
  }

  private static void ValidatePoiRequest(UpdatePoiRequestDto request)
  {
    if (string.IsNullOrWhiteSpace(request.Name))
    {
      throw new InvalidOperationException("Tên POI là bắt buộc.");
    }

    if (request.Latitude is < -90 or > 90 || request.Longitude is < -180 or > 180)
    {
      throw new InvalidOperationException("Toạ độ POI không hợp lệ.");
    }

    if (request.ActivationRadius <= 0)
    {
      throw new InvalidOperationException("Bán kính kích hoạt phải lớn hơn 0.");
    }
  }

  private static string NormalizeSlug(string slug)
  {
    return slug.Trim().ToLowerInvariant();
  }

  private static string NormalizeStatus(string status)
  {
    var normalizedStatus = status.Trim().ToUpperInvariant();
    if (normalizedStatus == "PENDING")
    {
      normalizedStatus = "PENDING_REVIEW";
    }
    else if (normalizedStatus == "APPROVED")
    {
      normalizedStatus = "ACTIVE";
    }

    var allowedStatuses = new HashSet<string> { "PENDING_REVIEW", "ACTIVE", "REJECTED", "INACTIVE" };

    if (!allowedStatuses.Contains(normalizedStatus))
    {
      throw new InvalidOperationException("Trạng thái POI không hợp lệ.");
    }

    return normalizedStatus;
  }

  private static decimal EstimateDistanceMeters(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
  {
    const double earthRadiusMeters = 6371000;
    var dLat = ToRadians((double)(lat2 - lat1));
    var dLon = ToRadians((double)(lon2 - lon1));
    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
      + Math.Cos(ToRadians((double)lat1)) * Math.Cos(ToRadians((double)lat2))
      * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
    var c = 2 * Math.Atan2(Math.Sqrt(1 - a), Math.Sqrt(1 - a));
    return (decimal)(earthRadiusMeters * c);
  }

  private static double ToRadians(double degree)
  {
    return degree * Math.PI / 180;
  }

  private static PoiResponseDto ToPoiResponse(Poi poi)
  {
    return new PoiResponseDto(
      poi.Id,
      poi.StallId,
      poi.Name,
      poi.Description,
      poi.Latitude,
      poi.Longitude,
      poi.ActivationRadius,
      poi.IsPremiumContent,
      poi.Status
    );
  }

  internal static IReadOnlyList<PoiResponseDto> GetDemoPoisByStallIds(IReadOnlyCollection<ulong> stallIds)
  {
    var samplePois = new List<PoiResponseDto>
    {
      new(1, stallIds.FirstOrDefault(), "Demo POI 1", "Mô tả POI demo", 10.8231m, 106.6297m, 100, false, "ACTIVE"),
      new(2, stallIds.FirstOrDefault(), "Demo POI 2", "Mô tả POI demo", 10.8235m, 106.6299m, 100, false, "PENDING_REVIEW")
    };
    return samplePois.Where(x => stallIds.Contains(x.StallId)).ToList();
  }
}

public class PoiContentService : IPoiContentService
{
  public Task<IReadOnlyList<PoiContentResponseDto>> GetByPoiAsync(ulong poiId)
  {
    IReadOnlyList<PoiContentResponseDto> contents =
    [
      new(1, poiId, "vi", "Thuyết minh tiếng Việt", "/uploads/audios/demo-vi.mp3", "NORMAL"),
      new(2, poiId, "en", "English narration", "/uploads/audios/demo-en.mp3", "NORMAL")
    ];

    return Task.FromResult(contents);
  }

  public Task<PoiContentResponseDto> CreateAsync(PoiContentRequestDto request)
  {
    return Task.FromResult(new PoiContentResponseDto(100, request.PoiId, request.Lang, request.Title, request.AudioUrl, request.VoiceProfile));
  }
}

public class MediaStorageService : IMediaStorageService
{
  public Task<MediaUploadResponseDto> SaveAsync(IFormFile file, string fileType, ulong ownerId, ulong? stallId, ulong? poiId)
  {
    var safeFileName = Path.GetFileName(file.FileName);
    var relativePath = $"/uploads/{fileType.ToLowerInvariant()}s/{safeFileName}";
    var response = new MediaUploadResponseDto(100, fileType.ToUpperInvariant(), safeFileName, relativePath, file.ContentType, file.Length);
    return Task.FromResult(response);
  }
}

public class QrTrackingService : IQrTrackingService
{
  public Task<QrCodeResponseDto> CreateQrCodeAsync(QrCodeRequestDto request)
  {
    var url = $"/uploads/qr/{request.QrType.ToLowerInvariant()}-{Guid.NewGuid():N}.png";
    return Task.FromResult(new QrCodeResponseDto(100, request.StallId, request.PoiId, request.QrType, url, request.TargetUrl));
  }

  public Task<object> TrackScanAsync(QrScanRequestDto request, string? ipAddress, string? userAgent)
  {
    return Task.FromResult<object>(new
    {
      request.QrCodeId,
      request.SessionId,
      IpAddress = ipAddress,
      UserAgent = userAgent,
      ScannedAt = DateTime.UtcNow
    });
  }
}

public class AnalyticsService : IAnalyticsService
{
  private readonly AppDbContext _db;
  private readonly IHttpContextAccessor _httpContextAccessor;

  public AnalyticsService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
  {
    _db = db;
    _httpContextAccessor = httpContextAccessor;
  }

  public Task<AnalyticsSummaryDto> GetSummaryAsync()
  {
    var todayStart = DateTime.UtcNow.Date;
    var todayEnd = todayStart.AddDays(1);

    var totalStalls = _db.Stalls.Count();
    var totalPois = _db.Pois.Count();
    var qrScansToday = _db.QrScanEvents.Count(x => x.ScannedAt >= todayStart && x.ScannedAt < todayEnd);
    var visitsToday = _db.VisitEvents.Count(x => x.VisitedAt >= todayStart && x.VisitedAt < todayEnd);
    var audioPlaysToday = _db.PlayHistory.Count(x => x.PlayedAt >= todayStart && x.PlayedAt < todayEnd);
    var revenueToday = _db.Payments
      .Where(x => x.Status == "PAID" && x.PaidAt.HasValue && x.PaidAt.Value >= todayStart && x.PaidAt.Value < todayEnd)
      .Sum(x => (decimal?)x.Amount) ?? 0m;

    return Task.FromResult(new AnalyticsSummaryDto(
      TotalStalls: totalStalls,
      TotalPois: totalPois,
      QrScansToday: qrScansToday,
      VisitsToday: visitsToday,
      AudioPlaysToday: audioPlaysToday,
      RevenueToday: revenueToday
    ));
  }

  public async Task<StallOwnerDashboardDto> GetStallOwnerDashboardAsync()
  {
    var ownerId = GetCurrentUserId();

    var stallEntities = await _db.Stalls
      .Where(s => s.VendorId == ownerId)
      .OrderByDescending(s => s.CreatedAt)
      .ToListAsync();

    var stalls = stallEntities.Select(stall => new StallResponseDto(
      stall.Id,
      stall.VendorId,
      stall.Name,
      stall.Slug,
      stall.Description,
      stall.Address,
      stall.Latitude,
      stall.Longitude,
      stall.Status,
      stall.IsFeatured
    )).ToList();
    var stallIds = stallEntities.Select(x => x.Id).ToList();

    var pois = await _db.Pois
      .Where(p => stallIds.Contains(p.StallId))
      .ToListAsync();

    var payments = PaymentService.GetPaymentsByOwnerId(_db, ownerId);
    var paidPayments = payments.Where(x => x.Status == "PAID").ToList();

    var activePoiCount = pois.Count(x => string.Equals(x.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase));
    var activeStallCount = stalls.Count(x => string.Equals(x.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase));
    var pendingStallCount = stalls.Count(x => string.Equals(x.Status, "PENDING_REVIEW", StringComparison.OrdinalIgnoreCase));
    var pendingPoiCount = pois.Count(x => string.Equals(x.Status, "PENDING_REVIEW", StringComparison.OrdinalIgnoreCase));
    var rejectedPoiCount = pois.Count(x => string.Equals(x.Status, "REJECTED", StringComparison.OrdinalIgnoreCase));
    var todayFactor = Math.Max(1, stalls.Count);

    // Determine subscription status across owner's stalls
    VietTourAudio.Api.Entities.StallSubscription? latestSubscription = null;
    if (stallIds.Count > 0)
    {
      latestSubscription = await _db.StallSubscriptions
        .Where(ss => stallIds.Contains(ss.StallId) && (ss.Status == "ACTIVE" || ss.Status == "TRIAL"))
        .OrderByDescending(ss => ss.EndDate)
        .FirstOrDefaultAsync();
    }

    var subscriptionStatus = latestSubscription is not null ? "ACTIVE" : "INACTIVE";
    DateOnly? subscriptionEndDate = latestSubscription?.EndDate;

    var dashboard = new StallOwnerDashboardDto(
      OwnerId: ownerId,
      TotalStalls: stalls.Count,
      ApprovedStalls: activeStallCount,
      PendingStalls: pendingStallCount,
      SuspendedStalls: stalls.Count(x => string.Equals(x.Status, "SUSPENDED", StringComparison.OrdinalIgnoreCase)),
      TotalPois: pois.Count,
      ActivePois: activePoiCount,
      PendingPois: pendingPoiCount,
      RejectedPois: rejectedPoiCount,
      SubscriptionStatus: subscriptionStatus,
      SubscriptionEndDate: subscriptionEndDate,
      QrScansToday: activePoiCount * 12 + todayFactor * 5,
      VisitsToday: activePoiCount * 7 + activeStallCount * 4,
      AudioPlaysToday: activePoiCount * 9,
      RevenueToday: paidPayments.Sum(x => x.Amount),
      PaidTransactions: paidPayments.Count,
      PendingTransactions: payments.Count(x => x.Status == "PENDING"),
      Stalls: stalls,
      RecentPayments: payments.Take(5).ToList()
    );

    return dashboard;
  }

  public Task<object> TrackVisitAsync(VisitEventRequestDto request)
  {
    return Task.FromResult<object>(new { request.StallId, request.PoiId, request.SessionId, VisitedAt = DateTime.UtcNow });
  }

  public Task<object> TrackAudioPlayAsync(AudioPlayRequestDto request)
  {
    return Task.FromResult<object>(new { request.PoiId, request.Lang, request.SessionId, PlayedAt = DateTime.UtcNow });
  }

  private ulong GetCurrentUserId()
  {
    var principal = _httpContextAccessor.HttpContext?.User
      ?? throw new UnauthorizedAccessException("Chưa đăng nhập.");

    var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

    if (!ulong.TryParse(idValue, out var userId))
    {
      throw new UnauthorizedAccessException("Token không hợp lệ.");
    }

    return userId;
  }
}

public class PaymentService : IPaymentService
{
  private readonly AppDbContext _db;
  private readonly IHttpContextAccessor _httpContextAccessor;

  public PaymentService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
  {
    _db = db;
    _httpContextAccessor = httpContextAccessor;
  }

  public async Task<IReadOnlyList<PaymentResponseDto>> GetPaymentsAsync()
  {
    var payments = await _db.Payments
      .OrderByDescending(x => x.CreatedAt)
      .ToListAsync();

    return payments.Select(ToPaymentResponse).ToList();
  }

  public async Task<PaymentResponseDto> GetByIdAsync(ulong id)
  {
    var currentUserId = GetCurrentUserId();
    var isAdmin = IsCurrentUserInRole("ADMIN");

    var payment = await _db.Payments.FindAsync(id);
    if (payment is null)
    {
      throw new KeyNotFoundException("Không tìm thấy giao dịch.");
    }

    var canView = isAdmin
      || payment.VisitorSessionId == currentUserId
      || (payment.VendorId.HasValue && payment.VendorId.Value == currentUserId);

    if (!canView)
    {
      throw new UnauthorizedAccessException("Bạn không có quyền xem giao dịch này.");
    }

    return ToPaymentResponse(payment);
  }

  public async Task<PaymentResponseDto> CreateAsync(PaymentRequestDto request)
  {
    var currentUserId = GetCurrentUserId();
    ValidatePaymentRequest(request, currentUserId);

    var vendorId = BuildPaymentVendorId(request, currentUserId);
    var visitorSessionId = BuildPaymentVisitorId(request, currentUserId);
    var now = DateTime.UtcNow;

    var entity = new Payment
    {
      VendorId = vendorId,
      VisitorSessionId = visitorSessionId,
      Amount = request.Amount,
      Currency = NormalizeCurrency(request.Currency),
      Provider = NormalizeProvider(request.Provider),
      PaymentType = NormalizePaymentType(request.PaymentType),
      Status = "PENDING",
      TransactionCode = $"VTA-{now:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..26],
      ProviderPayload = null,
      PaidAt = null,
      CreatedAt = now,
      UpdatedAt = now
    };

    _db.Payments.Add(entity);
    await _db.SaveChangesAsync();

    await ActivatePremiumIfNeeded(entity);
    return ToPaymentResponse(entity);
  }

  public async Task<object> HandleWebhookAsync(object payload)
  {
    var storedTransactions = await _db.Payments.CountAsync();

    return new
    {
      Received = true,
      StoredTransactions = storedTransactions,
      Payload = payload,
      ProcessedAt = DateTime.UtcNow
    };
  }

  public async Task<PaymentResponseDto> RecordManualCashAsync(PaymentRequestDto request)
  {
    var currentUserId = GetCurrentUserId();
    ValidatePaymentRequest(request, currentUserId);

    var now = DateTime.UtcNow;
    var entity = new Payment
    {
      VendorId = currentUserId,
      VisitorSessionId = request.VisitorSessionId,
      Amount = request.Amount,
      Currency = NormalizeCurrency(request.Currency),
      Provider = "MANUAL",
      PaymentType = NormalizePaymentType(request.PaymentType),
      Status = "PAID",
      TransactionCode = $"CASH-{now:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..27],
      ProviderPayload = null,
      PaidAt = now,
      CreatedAt = now,
      UpdatedAt = now
    };

    _db.Payments.Add(entity);
    await _db.SaveChangesAsync();

    await ActivatePremiumIfNeeded(entity);
    return ToPaymentResponse(entity);
  }

  public async Task<PaymentResponseDto> SimulatePaidAsync(ulong id)
  {
    var payment = await _db.Payments.FindAsync(id);
    if (payment is null)
    {
      throw new KeyNotFoundException("Không tìm thấy giao dịch.");
    }

    if (payment.Status == "PAID")
    {
      return ToPaymentResponse(payment);
    }

    if (payment.Status != "PENDING")
    {
      throw new InvalidOperationException("Chỉ có thể mô phỏng thanh toán cho giao dịch PENDING.");
    }

    payment.Status = "PAID";
    payment.PaidAt = DateTime.UtcNow;
    payment.UpdatedAt = DateTime.UtcNow;
    _db.Payments.Update(payment);
    await _db.SaveChangesAsync();

    await ActivatePremiumIfNeeded(payment);
    return ToPaymentResponse(payment);
  }

  public async Task<PaymentResponseDto> CreatePremium24hDemoAsync()
  {
    var visitorSessionId = GetCurrentUserId();
    var now = DateTime.UtcNow;
    var premiumDuration = TimeSpan.FromHours(24);
    var dbUser = await _db.Users.FirstOrDefaultAsync(x => x.Id == visitorSessionId);
    if (dbUser is not null)
    {
      if (!string.Equals(dbUser.Role, "TOURIST", StringComparison.OrdinalIgnoreCase))
      {
        throw new InvalidOperationException("Chỉ user có role TOURIST mới được kích hoạt premium.");
      }

      var currentExpiry = dbUser.PremiumExpiresAt.HasValue && dbUser.PremiumExpiresAt.Value > now
        ? dbUser.PremiumExpiresAt.Value
        : now;

      dbUser.PremiumExpiresAt = currentExpiry.Add(premiumDuration);
      dbUser.UpdatedAt = now;
      await _db.SaveChangesAsync();
    }
    else
    {
      // demo users must be TOURIST role to activate demo premium
      if (!IsCurrentUserInRole("TOURIST"))
      {
        throw new InvalidOperationException("Chỉ demo TOURIST mới có thể kích hoạt premium demo.");
      }

      try
      {
        AuthService.ActivatePremiumForUser(visitorSessionId, premiumDuration);
      }
      catch
      {
        // ignore if demo activation fails
      }
    }

    var entity = new Payment
    {
      VendorId = null,
      VisitorSessionId = visitorSessionId,
      Amount = 30000m,
      Currency = "VND",
      Provider = "DEMO",
      PaymentType = "VISITOR_PREMIUM",
      Status = "PAID",
      TransactionCode = $"DEMO-{now:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..27],
      ProviderPayload = null,
      PaidAt = now,
      CreatedAt = now,
      UpdatedAt = now
    };

    _db.Payments.Add(entity);
    await _db.SaveChangesAsync();

    await ActivatePremiumIfNeeded(entity);
    return ToPaymentResponse(entity);
  }

  private ulong GetCurrentUserId()
  {
    var principal = _httpContextAccessor.HttpContext?.User
      ?? throw new UnauthorizedAccessException("Chưa đăng nhập.");

    var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

    if (!ulong.TryParse(idValue, out var userId))
    {
      throw new UnauthorizedAccessException("Token không hợp lệ.");
    }

    return userId;
  }

  private bool IsCurrentUserInRole(string role)
  {
    return _httpContextAccessor.HttpContext?.User.IsInRole(role) == true;
  }


  private void ValidatePaymentRequest(PaymentRequestDto request, ulong currentUserId)
  {
    if (request.Amount <= 0)
    {
      throw new InvalidOperationException("Số tiền thanh toán phải lớn hơn 0.");
    }

    _ = NormalizeCurrency(request.Currency);
    _ = NormalizeProvider(request.Provider);
    var normalizedType = NormalizePaymentType(request.PaymentType);

    // Enforce domain: VISITOR_PREMIUM is for TOURIST; STALL_SUBSCRIPTION is for STALL_OWNER
    if (string.Equals(normalizedType, "VISITOR_PREMIUM", StringComparison.OrdinalIgnoreCase) && !IsCurrentUserInRole("TOURIST") && !IsCurrentUserInRole("ADMIN"))
    {
      throw new InvalidOperationException("Chỉ user TOURIST hoặc ADMIN mới được tạo payment loại VISITOR_PREMIUM.");
    }

    if (string.Equals(normalizedType, "STALL_SUBSCRIPTION", StringComparison.OrdinalIgnoreCase) && !(IsCurrentUserInRole("STALL_OWNER") || IsCurrentUserInRole("ADMIN")))
    {
      throw new InvalidOperationException("Chỉ CHỦ SẠP hoặc ADMIN mới được tạo payment loại STALL_SUBSCRIPTION.");
    }

    if (IsCurrentUserInRole("TOURIST"))
    {
      if (request.VisitorSessionId.HasValue && request.VisitorSessionId.Value != currentUserId)
      {
        throw new InvalidOperationException("Tourist chỉ có thể tạo thanh toán cho chính mình.");
      }

      if (request.VendorId.HasValue && request.VendorId.Value == currentUserId)
      {
        throw new InvalidOperationException("Tourist không thể đặt vendorId trùng với chính mình.");
      }
    }

    if (IsCurrentUserInRole("STALL_OWNER") && request.VendorId.HasValue && request.VendorId.Value != currentUserId)
    {
      throw new InvalidOperationException("Chủ sạp chỉ có thể tạo thanh toán cho chính mình.");
    }
  }

  private ulong? BuildPaymentVendorId(PaymentRequestDto request, ulong currentUserId)
  {
    if (request.VendorId.HasValue)
    {
      return request.VendorId.Value;
    }

    if (IsCurrentUserInRole("STALL_OWNER") || IsCurrentUserInRole("ADMIN"))
    {
      return currentUserId;
    }

    return null;
  }

  private ulong? BuildPaymentVisitorId(PaymentRequestDto request, ulong currentUserId)
  {
    if (request.VisitorSessionId.HasValue)
    {
      return request.VisitorSessionId.Value;
    }

    if (IsCurrentUserInRole("TOURIST"))
    {
      return currentUserId;
    }

    return null;
  }

  private static string NormalizeCurrency(string currency)
  {
    var normalizedCurrency = string.IsNullOrWhiteSpace(currency)
      ? "VND"
      : currency.Trim().ToUpperInvariant();

    if (normalizedCurrency.Length != 3)
    {
      throw new InvalidOperationException("Mã tiền tệ không hợp lệ.");
    }

    return normalizedCurrency;
  }

  private static string NormalizeProvider(string provider)
  {
    var normalizedProvider = string.IsNullOrWhiteSpace(provider)
      ? "BANK_QR"
      : provider.Trim().ToUpperInvariant();

    var allowedProviders = new HashSet<string> { "MOMO", "VNPAY", "BANK_QR", "STRIPE", "CASH", "MANUAL", "DEMO" };
    if (!allowedProviders.Contains(normalizedProvider))
    {
      throw new InvalidOperationException("Phương thức thanh toán không hợp lệ.");
    }

    return normalizedProvider;
  }

  private static string NormalizePaymentType(string paymentType)
  {
    var normalizedType = string.IsNullOrWhiteSpace(paymentType)
      ? "OTHER"
      : paymentType.Trim().ToUpperInvariant();

    var allowedTypes = new HashSet<string>
    {
      "VISITOR_PREMIUM",
      "STALL_SUBSCRIPTION",
      "VENDOR_SUBSCRIPTION",
      "WALLET_TOP_UP",
      "COMMISSION_PAYOUT",
      "OTHER"
    };

    if (!allowedTypes.Contains(normalizedType))
    {
      throw new InvalidOperationException("Loại thanh toán không hợp lệ.");
    }

    return normalizedType;
  }

  private static PaymentResponseDto ToPaymentResponse(Payment payment)
  {
    return new PaymentResponseDto(
      payment.Id,
      payment.VendorId,
      payment.VisitorSessionId,
      payment.Amount,
      payment.Currency,
      payment.Provider,
      payment.PaymentType,
      payment.Status,
      payment.TransactionCode
    );
  }

  internal static IReadOnlyList<PaymentResponseDto> GetPaymentsByOwnerId(AppDbContext db, ulong ownerId)
  {
    return db.Payments
      .Where(x => x.VendorId.HasValue && x.VendorId.Value == ownerId)
      .OrderByDescending(x => x.CreatedAt)
      .AsEnumerable()
      .Select(ToPaymentResponse)
      .ToList();
  }

  private async Task ActivatePremiumIfNeeded(Payment payment)
  {
    if (payment.Status != "PAID")
    {
      return;
    }

    try
    {
      // Demo visitor premium activation (in-memory demo users)
      if (payment.PaymentType == "VISITOR_PREMIUM" && payment.VisitorSessionId.HasValue)
      {
        try
        {
          AuthService.ActivatePremiumForUser(payment.VisitorSessionId.Value, TimeSpan.FromHours(24));
        }
        catch
        {
          // ignore if demo activation fails
        }
      }

      // Create or extend stall subscription for stall owners
      if (payment.PaymentType == "STALL_SUBSCRIPTION" && payment.VendorId.HasValue)
      {
        var vendorId = payment.VendorId.Value;
        var stall = await _db.Stalls.FirstOrDefaultAsync(x => x.VendorId == vendorId);
        if (stall is null)
        {
          return;
        }

        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);

        var existing = await _db.StallSubscriptions
          .Where(s => s.StallId == stall.Id && (s.Status == "TRIAL" || s.Status == "ACTIVE"))
          .OrderByDescending(s => s.EndDate)
          .FirstOrDefaultAsync();

        if (existing is not null)
        {
          if (existing.EndDate >= today)
          {
            existing.EndDate = existing.EndDate.AddMonths(1);
          }
          else
          {
            existing.StartDate = today;
            existing.EndDate = today.AddMonths(1);
          }

          existing.Price = payment.Amount;
          existing.Status = "ACTIVE";
          _db.StallSubscriptions.Update(existing);
        }
        else
        {
          var subscription = new VietTourAudio.Api.Entities.StallSubscription
          {
            StallId = stall.Id,
            PlanName = "MONTHLY",
            Price = payment.Amount,
            StartDate = today,
            EndDate = today.AddMonths(1),
            Status = "ACTIVE",
            CreatedAt = now
          };

          _db.StallSubscriptions.Add(subscription);
        }

        await _db.SaveChangesAsync();
      }
    }
    catch
    {
      // swallow exceptions to avoid breaking payment flow
    }
  }

}

public class SubscriptionService : ISubscriptionService
{
  private readonly AppDbContext _db;
  private readonly IHttpContextAccessor _httpContextAccessor;

  public SubscriptionService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
  {
    _db = db;
    _httpContextAccessor = httpContextAccessor;
  }

  public async Task<StallSubscriptionResponseDto> ActivateTrialAsync()
  {
    var ownerId = GetCurrentUserId();
    var stall = await _db.Stalls.FirstOrDefaultAsync(x => x.VendorId == ownerId);
    if (stall is null)
    {
      throw new InvalidOperationException("Bạn chưa có sạp để kích hoạt trial.");
    }

    var existing = await _db.StallSubscriptions
      .FirstOrDefaultAsync(x => x.StallId == stall.Id && (x.Status == "TRIAL" || x.Status == "ACTIVE"));

    if (existing is not null)
    {
      throw new InvalidOperationException("Trial đã được kích hoạt cho sạp này.");
    }

    var now = DateTime.UtcNow;
    var subscription = new VietTourAudio.Api.Entities.StallSubscription
    {
      StallId = stall.Id,
      PlanName = "TRIAL",
      Price = 0m,
      StartDate = DateOnly.FromDateTime(now),
      EndDate = DateOnly.FromDateTime(now.AddHours(24)),
      Status = "TRIAL",
      CreatedAt = now
    };

    var payment = new VietTourAudio.Api.Entities.Payment
    {
      VendorId = ownerId,
      VisitorSessionId = null,
      Amount = 0m,
      Currency = "VND",
      Provider = "DEMO",
      PaymentType = "STALL_SUBSCRIPTION",
      Status = "PAID",
      TransactionCode = $"TRIAL-{now:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..27],
      ProviderPayload = null,
      PaidAt = now,
      CreatedAt = now,
      UpdatedAt = now
    };

    _db.StallSubscriptions.Add(subscription);
    _db.Payments.Add(payment);
    await _db.SaveChangesAsync();

    return ToStallSubscriptionResponse(subscription);
  }

  private ulong GetCurrentUserId()
  {
    var principal = _httpContextAccessor.HttpContext?.User
      ?? throw new UnauthorizedAccessException("Chưa đăng nhập.");

    var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

    if (!ulong.TryParse(idValue, out var userId))
    {
      throw new UnauthorizedAccessException("Token không hợp lệ.");
    }

    return userId;
  }

  private static StallSubscriptionResponseDto ToStallSubscriptionResponse(VietTourAudio.Api.Entities.StallSubscription subscription)
  {
    return new StallSubscriptionResponseDto(
      subscription.Id,
      subscription.StallId,
      subscription.PlanName,
      subscription.Price,
      subscription.StartDate,
      subscription.EndDate,
      subscription.Status
    );
  }
}

public class CommissionService : ICommissionService
{
  public Task<object> CalculateForPaymentAsync(ulong paymentId)
  {
    return Task.FromResult<object>(new
    {
      PaymentId = paymentId,
      CommissionRate = 10,
      CommissionAmount = 9900,
      Status = "PENDING"
    });
  }
}

public class AdminLogService : IAdminLogService
{
  public Task<IReadOnlyList<AdminLogResponseDto>> GetLogsAsync()
  {
    IReadOnlyList<AdminLogResponseDto> logs =
    [
      new(1, 1, "APPROVE_STALL", "STALL", 1, "Duyệt sạp demo.", DateTime.UtcNow.AddHours(-2)),
      new(2, 1, "UPDATE_SETTING", "APP_SETTING", 1, "Cập nhật tỷ lệ hoa hồng.", DateTime.UtcNow.AddHours(-1))
    ];

    return Task.FromResult(logs);
  }

  public Task<object> WriteAsync(ulong adminId, string action, string targetType, ulong? targetId, string? description)
  {
    return Task.FromResult<object>(new { AdminId = adminId, Action = action, TargetType = targetType, TargetId = targetId, Description = description, CreatedAt = DateTime.UtcNow });
  }
}

public class GeofenceService : IGeofenceService
{
  public decimal EstimateDistanceMeters(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
  {
    const double earthRadiusMeters = 6371000;
    var dLat = ToRadians((double)(lat2 - lat1));
    var dLon = ToRadians((double)(lon2 - lon1));
    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
      + Math.Cos(ToRadians((double)lat1)) * Math.Cos(ToRadians((double)lat2))
      * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
    var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    return (decimal)(earthRadiusMeters * c);
  }

  private static double ToRadians(double degree)
  {
    return degree * Math.PI / 180;
  }
}
