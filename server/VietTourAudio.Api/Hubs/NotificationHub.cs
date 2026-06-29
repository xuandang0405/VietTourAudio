using Microsoft.AspNetCore.SignalR;
using VietTourAudio.Api.Services;

namespace VietTourAudio.Api.Hubs;

public sealed class NotificationHub(IPresenceTracker presence, ILogger<NotificationHub> logger) : Hub
{
  public const string AdminPresenceGroup = "admin-presence";

  public async Task JoinZone(string zoneId)
  {
    var normalizedZone = NormalizeZone(zoneId);
    var snapshot = presence.MoveToZone(Context.ConnectionId, normalizedZone);
    await Clients.Group(AdminPresenceGroup).SendAsync("PresenceUpdated", snapshot);
  }

  public async Task LeaveZone()
  {
    var snapshot = presence.Remove(Context.ConnectionId);
    await Clients.Group(AdminPresenceGroup).SendAsync("PresenceUpdated", snapshot);
  }

  public async Task JoinAdminDashboard()
  {
    if (Context.User?.Identity?.IsAuthenticated != true ||
        !(Context.User.IsInRole("SUPER_ADMIN") || Context.User.IsInRole("ADMIN") ||
          Context.User.IsInRole("MODERATOR") || Context.User.IsInRole("FINANCE")))
    {
      throw new HubException("Admin authorization is required.");
    }

    await Groups.AddToGroupAsync(Context.ConnectionId, AdminPresenceGroup);
    await Clients.Caller.SendAsync("PresenceUpdated", presence.Snapshot());
  }

  public override async Task OnDisconnectedAsync(Exception? exception)
  {
    try
    {
      var snapshot = presence.Remove(Context.ConnectionId);
      await Clients.Group(AdminPresenceGroup).SendAsync("PresenceUpdated", snapshot);
    }
    catch (Exception cleanupError)
    {
      logger.LogError(cleanupError, "Presence cleanup failed for connection {ConnectionId}.", Context.ConnectionId);
    }
    finally
    {
      await base.OnDisconnectedAsync(exception);
    }
  }

  private static string NormalizeZone(string zoneId)
  {
    var value = zoneId?.Trim();
    if (string.IsNullOrWhiteSpace(value) || value.Length > 160)
      throw new HubException("A valid zone identifier is required.");
    return value.ToLowerInvariant();
  }
}
