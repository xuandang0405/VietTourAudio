using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace VietTourAudio.Api.Data;

public static class DatabaseSql
{
  public static async Task<DbConnection> OpenConnectionAsync(AppDbContext db)
  {
    var connection = db.Database.GetDbConnection();
    if (connection.State != System.Data.ConnectionState.Open)
    {
      await connection.OpenAsync();
    }
    return connection;
  }

  public static DbParameter AddParameter(this DbCommand command, string name, object? value)
  {
    var parameter = command.CreateParameter();
    parameter.ParameterName = name;
    parameter.Value = value ?? DBNull.Value;
    command.Parameters.Add(parameter);
    return parameter;
  }

  public static string? NullableString(this DbDataReader reader, string name)
  {
    var ordinal = reader.GetOrdinal(name);
    return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
  }

  public static ulong UInt64(this DbDataReader reader, string name) => Convert.ToUInt64(reader[name]);
  public static int Int32(this DbDataReader reader, string name) => Convert.ToInt32(reader[name]);
  public static decimal Decimal(this DbDataReader reader, string name) => Convert.ToDecimal(reader[name]);
  public static bool Boolean(this DbDataReader reader, string name) => Convert.ToBoolean(reader[name]);

  public static async Task<ulong> LastInsertIdAsync(DbConnection connection)
  {
    await using var command = connection.CreateCommand();
    command.CommandText = "SELECT LAST_INSERT_ID()";
    return Convert.ToUInt64(await command.ExecuteScalarAsync());
  }

  public static async Task<List<Dictionary<string, object?>>> QueryRowsAsync(
    AppDbContext db, string sql, IReadOnlyDictionary<string, object?>? parameters = null)
  {
    var connection = await OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    if (db.Database.CurrentTransaction is { } transaction) command.Transaction = transaction.GetDbTransaction();
    command.CommandText = sql;
    if (parameters is not null)
      foreach (var item in parameters) command.AddParameter(item.Key, item.Value);
    var rows = new List<Dictionary<string, object?>>();
    await using var reader = await command.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
      var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
      for (var index = 0; index < reader.FieldCount; index++)
      {
        var value = reader.IsDBNull(index) ? null : reader.GetValue(index);
        row[reader.GetName(index)] = value is ulong or long ? value.ToString() : value;
      }
      rows.Add(row);
    }
    return rows;
  }

  public static async Task<int> ExecuteAsync(
    AppDbContext db, string sql, IReadOnlyDictionary<string, object?>? parameters = null)
  {
    var connection = await OpenConnectionAsync(db);
    await using var command = connection.CreateCommand();
    if (db.Database.CurrentTransaction is { } transaction) command.Transaction = transaction.GetDbTransaction();
    command.CommandText = sql;
    if (parameters is not null)
      foreach (var item in parameters) command.AddParameter(item.Key, item.Value);
    return await command.ExecuteNonQueryAsync();
  }
}
