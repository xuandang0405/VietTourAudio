using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;
using VietTourAudio.Api.Helpers;

namespace VietTourAudio.Api.Services;

public sealed class PaymentEntitlementService(
  AppDbContext db,
  ILogger<PaymentEntitlementService> logger)
{
  public async Task<bool> ApplyAsync(PaymentTransaction transaction)
  {
    var senderId = transaction.SenderId?.Trim() ?? "";
    var senderType = transaction.SenderType?.Trim().ToUpperInvariant() ?? "";
    var transactionType = transaction.TransactionType?.Trim().ToUpperInvariant() ?? "";

    logger.LogInformation(
      "[PROCESSING ENTITLEMENT] Transaction {TransactionId}; sender type {SenderType}; sender {SenderId}; entitlement {TransactionType}",
      transaction.Id,
      senderType,
      senderId,
      transactionType);

    if (string.IsNullOrWhiteSpace(transaction.Id) ||
        string.IsNullOrWhiteSpace(senderId) ||
        senderId == Guid.Empty.ToString("N") ||
        senderId == Guid.Empty.ToString())
    {
      logger.LogError(
        "[CRITICAL ENTITLEMENT FAULT] Transaction {TransactionId} has no valid sender binding.",
        transaction.Id);
      return false;
    }

    try
    {
      return senderType switch
      {
        "USER" when transactionType == "USER_PREMIUM" =>
          await ApplyUserPremiumAsync(transaction.Id, senderId),
        "VENDOR" when transactionType is "VENDOR_PREMIUM" or "VENDOR_SUBSCRIPTION" =>
          await ApplyVendorEntitlementAsync(transaction.Id, senderId, transactionType),
        _ => RejectUnsupported(transaction.Id, senderType, transactionType)
      };
    }
    catch (Exception exception)
    {
      logger.LogError(
        exception,
        "[ENTITLEMENT STORAGE FAILURE] Transaction {TransactionId} could not apply entitlement for {SenderType} {SenderId}.",
        transaction.Id,
        senderType,
        senderId);
      return false;
    }
  }

  private async Task<bool> ApplyUserPremiumAsync(string transactionId, string senderId)
  {
    var expiry = DateTime.UtcNow.AddHours(24);
    var normalizedUserId = Guid.TryParse(senderId, out var userGuid)
      ? userGuid.ToString("N")
      : senderId;
    var user = await db.Users.SingleOrDefaultAsync(candidate =>
      candidate.Id == senderId || candidate.Id == normalizedUserId);
    if (user is not null)
    {
      user.IsPremiumActive = true;
      user.PremiumExpiryDate = expiry;
      user.UpdatedAt = DateTime.UtcNow;
      logger.LogInformation(
        "[ENTITLEMENT APPLIED] User {UserId} received Premium until {ExpiryUtc} from transaction {TransactionId}.",
        user.Id,
        expiry,
        transactionId);
      return true;
    }

    // Anonymous tourists are represented by a server-registered visitor session.
    var sessions = await DatabaseSql.QueryRowsAsync(db, """
      SELECT token FROM visitor_sessions WHERE token=@senderId LIMIT 1
      """, new Dictionary<string, object?> { ["@senderId"] = senderId });
    if (sessions.Count == 0)
    {
      logger.LogError(
        "[ENTITLEMENT REJECTED] User/session sender {SenderId} from transaction {TransactionId} does not exist.",
        senderId,
        transactionId);
      return false;
    }

    var affected = await db.Database.ExecuteSqlInterpolatedAsync($"""
      UPDATE visitor_sessions
      SET is_premium=1,premium_24h_expiry={expiry},last_seen_at={DateTime.UtcNow}
      WHERE token={senderId}
      """);
    if (affected != 1)
    {
      logger.LogError(
        "[ENTITLEMENT REJECTED] Visitor session {SenderId} was not updated for transaction {TransactionId}.",
        senderId,
        transactionId);
      return false;
    }

    logger.LogInformation(
      "[ENTITLEMENT APPLIED] Visitor session {SenderId} received Premium until {ExpiryUtc} from transaction {TransactionId}.",
      senderId,
      expiry,
      transactionId);
    return true;
  }

  private async Task<bool> ApplyVendorEntitlementAsync(
    string transactionId,
    string senderId,
    string transactionType)
  {
    var vendorId = await ResolveVendorIdAsync(senderId);
    if (vendorId is null)
    {
      logger.LogError(
        "[ENTITLEMENT REJECTED] Vendor sender {SenderId} from transaction {TransactionId} does not exist.",
        senderId,
        transactionId);
      return false;
    }

    var vendor = await db.Vendors.SingleOrDefaultAsync(candidate => candidate.Id == vendorId);
    if (vendor is null)
    {
      logger.LogError(
        "[ENTITLEMENT REJECTED] Resolved vendor {VendorId} from transaction {TransactionId} is missing.",
        vendorId,
        transactionId);
      return false;
    }

    if (transactionType == "VENDOR_PREMIUM")
    {
      var now = DateTime.UtcNow;
      vendor.IsPremium = true;
      vendor.PremiumActivationDate = now;
      vendor.PremiumExpiryDate = now.AddDays(30);

      var pois = await db.Pois.Where(poi => poi.VendorId == vendorId).ToListAsync();
      foreach (var poi in pois)
      {
        poi.IsPremiumPriority = true;
        poi.TriggerRadius = 10;
        poi.UpdatedAt = now;
      }
    }

    // VENDOR_SUBSCRIPTION is represented by its approved ledger in the current
    // unified schema; no legacy numeric vendor_subscriptions row is required.
    logger.LogInformation(
      "[ENTITLEMENT APPLIED] Vendor {VendorId} received {TransactionType} from transaction {TransactionId}.",
      vendorId,
      transactionType,
      transactionId);
    return true;
  }

  private async Task<string?> ResolveVendorIdAsync(string senderId)
  {
    var normalizedVendorId = Guid.TryParse(senderId, out var vendorGuid)
      ? vendorGuid.ToString("N")
      : senderId;
    var directVendorId = await db.Vendors.AsNoTracking()
      .Where(vendor => vendor.Id == senderId || vendor.Id == normalizedVendorId)
      .Select(vendor => vendor.Id)
      .SingleOrDefaultAsync();
    if (directVendorId is not null) return directVendorId;

    var rows = await DatabaseSql.QueryRowsAsync(db, """
      SELECT vendor_id AS vendorId
      FROM vendor_portal_users
      WHERE id=@senderId LIMIT 1
      """, new Dictionary<string, object?> { ["@senderId"] = senderId });
    return rows.Count == 0 ? null : rows[0]["vendorId"]?.ToString();
  }

  private bool RejectUnsupported(string transactionId, string senderType, string transactionType)
  {
    logger.LogError(
      "[ENTITLEMENT REJECTED] Transaction {TransactionId} has unsupported sender/entitlement pairing {SenderType}/{TransactionType}.",
      transactionId,
      senderType,
      transactionType);
    return false;
  }
}
