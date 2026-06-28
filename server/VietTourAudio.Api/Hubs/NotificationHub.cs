using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

namespace VietTourAudio.Api.Hubs;

public sealed class NotificationHub : Hub
{
  // Thread-safe active connections counter memory cache
  private static int _activeUserCount;
  private static readonly ConcurrentDictionary<string, string> ConnectedClients = new();

  /// <summary>Exposes the live counter so controllers can read it without injecting the hub.</summary>
  public static int ActiveUserCount => Volatile.Read(ref _activeUserCount);

  public override async Task OnConnectedAsync()
  {
    var connectionId = Context.ConnectionId;
    if (ConnectedClients.TryAdd(connectionId, connectionId))
    {
      Interlocked.Increment(ref _activeUserCount);
      await Clients.All.SendAsync("UpdateActiveUsersCount", _activeUserCount);
    }
    await base.OnConnectedAsync();
  }

  public override async Task OnDisconnectedAsync(Exception? exception)
  {
    var connectionId = Context.ConnectionId;
    if (ConnectedClients.TryRemove(connectionId, out _))
    {
      Interlocked.Decrement(ref _activeUserCount);
      await Clients.All.SendAsync("UpdateActiveUsersCount", _activeUserCount);
    }
    await base.OnDisconnectedAsync(exception);
  }
}
