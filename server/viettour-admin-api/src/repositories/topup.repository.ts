import { PoolConnection } from 'mysql2/promise';
import { query } from '../lib/db';

export class TopUpRepository {
  async getTopUpRequests(status?: string): Promise<any[]> {
    const params: unknown[] = [];
    const where = status && status !== 'ALL' ? 'WHERE tur.status = ?' : '';
    if (where) params.push(status);

    return query<any[]>(
      `SELECT
         tur.*,
         v.trade_name, v.contact_email,
         vw.balance, vw.total_top_up,
         vs.status AS subscription_status,
         sp.name AS plan_name, sp.price AS plan_price
       FROM top_up_requests tur
       JOIN vendors v ON v.id = tur.vendor_id
       LEFT JOIN vendor_wallets vw ON vw.id = tur.wallet_id
       LEFT JOIN vendor_subscriptions vs ON vs.vendor_id = v.id
       LEFT JOIN subscription_plans sp ON sp.id = vs.plan_id
       ${where}
       ORDER BY tur.created_at DESC`,
      params
    );
  }

  async getRequestById(id: bigint): Promise<any | null> {
    const rows = await query<any[]>('SELECT * FROM top_up_requests WHERE id = ? LIMIT 1', [id.toString()]);
    return rows[0] || null;
  }

  async getRequestForUpdate(connection: PoolConnection, id: bigint): Promise<any | null> {
    const [rows] = await connection.execute<any[]>(
      `SELECT tur.*, v.trade_name
       FROM top_up_requests tur
       JOIN vendors v ON v.id = tur.vendor_id
       WHERE tur.id = ?
       FOR UPDATE`,
      [id.toString()]
    );
    return rows[0] || null;
  }

  async getWalletForUpdate(connection: PoolConnection, walletId: bigint): Promise<any | null> {
    const [rows] = await connection.execute<any[]>(
      'SELECT * FROM vendor_wallets WHERE id = ? FOR UPDATE',
      [walletId.toString()]
    );
    return rows[0] || null;
  }

  async updateRequestStatusTx(
    connection: PoolConnection,
    id: bigint,
    status: string,
    reviewedByUserId: string,
    note: string | null = null
  ): Promise<void> {
    await connection.execute(
      'UPDATE top_up_requests SET status = ?, reviewed_by_user_id = ?, reviewed_at = NOW(), note = ? WHERE id = ?',
      [status, reviewedByUserId, note, id.toString()]
    );
  }

  async updateWalletBalanceTx(
    connection: PoolConnection,
    walletId: bigint,
    balance: number,
    amount: number
  ): Promise<void> {
    await connection.execute(
      'UPDATE vendor_wallets SET balance = ?, total_top_up = total_top_up + ? WHERE id = ?',
      [balance, amount, walletId.toString()]
    );
  }

  async insertWalletTransactionTx(
    connection: PoolConnection,
    data: {
      walletId: string | number;
      vendorId: string | number;
      topUpRequestId: string | number;
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      description: string;
      createdByUserId: string;
    }
  ): Promise<bigint> {
    const [txResult] = await connection.execute<any>(
      `INSERT INTO wallet_transactions
        (wallet_id, vendor_id, top_up_request_id, transaction_type, direction, amount, balance_before, balance_after, description, created_by_user_id)
       VALUES (?, ?, ?, 'TOP_UP', 'CREDIT', ?, ?, ?, ?, ?)`,
      [
        data.walletId.toString(),
        data.vendorId.toString(),
        data.topUpRequestId.toString(),
        data.amount,
        data.balanceBefore,
        data.balanceAfter,
        data.description,
        data.createdByUserId,
      ]
    );
    return BigInt(txResult.insertId);
  }

  async updateRequestReject(
    id: bigint,
    status: string,
    reason: string,
    reviewedByUserId: string
  ): Promise<void> {
    await query(
      'UPDATE top_up_requests SET status = ?, note = ?, reviewed_by_user_id = ?, reviewed_at = NOW() WHERE id = ?',
      [status, reason, reviewedByUserId, id.toString()]
    );
  }
}
