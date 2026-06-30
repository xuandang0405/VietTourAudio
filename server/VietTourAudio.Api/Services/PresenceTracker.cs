using System.Collections.Concurrent;

namespace VietTourAudio.Api.Services;

public sealed record PresenceSnapshot(int TotalActive, IReadOnlyDictionary<string, int> ByZone, DateTime UpdatedAtUtc);

public interface IPresenceTracker
{
  PresenceSnapshot MoveToZone(string connectionId, string zoneId);
  PresenceSnapshot Remove(string connectionId);
  PresenceSnapshot Snapshot();
}

public sealed class PresenceTracker : IPresenceTracker
{
  private readonly ConcurrentDictionary<string, string> _connectionZones = new(StringComparer.Ordinal);

  public PresenceSnapshot MoveToZone(string connectionId, string zoneId)
  {
    _connectionZones.AddOrUpdate(connectionId, zoneId, (_, _) => zoneId);
    return Snapshot();
  }

  public PresenceSnapshot Remove(string connectionId)
  {
    _connectionZones.TryRemove(connectionId, out _);
    return Snapshot();
  }

  public PresenceSnapshot Snapshot()
  {
    var byZone = _connectionZones.Values
      .GroupBy(zone => zone, StringComparer.OrdinalIgnoreCase)
      .ToDictionary(group => group.Key, group => group.Count(), StringComparer.OrdinalIgnoreCase);
    return new PresenceSnapshot(_connectionZones.Count, byZone, DateTime.UtcNow);
  }
}
