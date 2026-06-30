using Microsoft.EntityFrameworkCore;
using VietTourAudio.Api.Data;
using VietTourAudio.Api.Domain;

namespace VietTourAudio.Api.Infrastructure;

public interface IRepository<TEntity> where TEntity : class, IEntity
{
  IQueryable<TEntity> Query();
  ValueTask<TEntity?> FindAsync(ulong id, CancellationToken cancellationToken = default);
  Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);
  void Remove(TEntity entity);
}

public sealed class Repository<TEntity>(AppDbContext db) : IRepository<TEntity> where TEntity : class, IEntity
{
  public IQueryable<TEntity> Query() => db.Set<TEntity>().AsQueryable();
  public ValueTask<TEntity?> FindAsync(ulong id, CancellationToken cancellationToken = default) =>
    db.Set<TEntity>().FindAsync([id], cancellationToken);
  public Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) =>
    db.Set<TEntity>().AddAsync(entity, cancellationToken).AsTask();
  public void Remove(TEntity entity) => db.Set<TEntity>().Remove(entity);
}

public interface IUnitOfWork
{
  Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
  Task<T> InTransactionAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken = default);
}

public sealed class UnitOfWork(AppDbContext db) : IUnitOfWork
{
  public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
    db.SaveChangesAsync(cancellationToken);

  public async Task<T> InTransactionAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken = default)
  {
    await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, cancellationToken);
    var result = await action(cancellationToken);
    await db.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);
    return result;
  }
}
