import { pool } from '../lib/db';
import { TopUpRepository } from '../repositories/topup.repository';

function mapTopUpRequest(row: any) {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    amount: row.amount,
    provider: row.provider,
    status: row.status,
    proofImageUrl: row.proof_url,
    rejectReason: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vendor: {
      id: String(row.vendor_id),
      businessName: row.trade_name,
      ownerEmail: row.contact_email,
      wallet: row.balance == null ? null : { balance: row.balance, totalTopUp: row.total_top_up },
      subscription: row.subscription_status
        ? {
            status: row.subscription_status,
            plan: { name: row.plan_name, monthlyPrice: row.plan_price },
          }
        : null,
    },
  };
}

export class TopUpService {
  private topUpRepo = new TopUpRepository();

  async getTopUpRequests(status?: string) {
    const rows = await this.topUpRepo.getTopUpRequests(status);
    return rows.map(mapTopUpRequest);
  }

  async approveRequest(id: bigint, userId: bigint) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const request = await this.topUpRepo.getRequestForUpdate(connection, id);
      if (!request) {
        await connection.rollback();
        const err = new Error('Top-up request not found');
        (err as any).statusCode = 404;
        throw err;
      }

      if (request.status !== 'PENDING') {
        await connection.rollback();
        const err = new Error('Top-up request is not pending');
        (err as any).statusCode = 409;
        throw err;
      }

      const wallet = await this.topUpRepo.getWalletForUpdate(connection, BigInt(request.wallet_id));
      if (!wallet) {
        await connection.rollback();
        const err = new Error('Wallet not found');
        (err as any).statusCode = 404;
        throw err;
      }

      const amount = Number(request.amount);
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      await this.topUpRepo.updateRequestStatusTx(connection, id, 'APPROVED', userId.toString());
      await this.topUpRepo.updateWalletBalanceTx(connection, BigInt(wallet.id), balanceAfter, amount);

      const txInsertId = await this.topUpRepo.insertWalletTransactionTx(connection, {
        walletId: wallet.id,
        vendorId: request.vendor_id,
        topUpRequestId: request.id,
        amount,
        balanceBefore,
        balanceAfter,
        description: `Top-up approved via ${request.provider}`,
        createdByUserId: userId.toString(),
      });

      await connection.commit();

      const result = {
        request: { ...mapTopUpRequest(request), status: 'APPROVED' },
        wallet: { id: String(wallet.id), balance: balanceAfter.toFixed(2) },
        transaction: { id: String(txInsertId), amount: amount.toFixed(2), balanceAfter: balanceAfter.toFixed(2) },
      };

      return {
        before: request,
        after: result,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async rejectRequest(id: bigint, reason: string, userId: bigint) {
    const before = await this.topUpRepo.getRequestById(id);
    if (!before) {
      const err = new Error('Top-up request not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (before.status !== 'PENDING') {
      const err = new Error('Top-up request is not pending');
      (err as any).statusCode = 409;
      throw err;
    }

    await this.topUpRepo.updateRequestReject(id, 'REJECTED', reason, userId.toString());
    const after = await this.topUpRepo.getRequestById(id);
    return {
      before,
      after: mapTopUpRequest(after),
    };
  }
}
