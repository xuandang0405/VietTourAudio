import { Prisma, UserRole, WalletTxType } from '@prisma/client';
import { prisma } from '../lib/prisma';

type TxClient = Prisma.TransactionClient;

type WalletMutationInput = {
  vendorId: bigint;
  amount: Prisma.Decimal;
  type: WalletTxType;
  description: string;
  allowOverdraft?: boolean;
};

export async function ensureVendorWallet(vendorId: bigint, tx: TxClient | typeof prisma = prisma) {
  const existing = await tx.vendorWallet.findUnique({ where: { vendorId } });
  if (existing) return existing;

  return tx.vendorWallet.create({
    data: {
      vendorId,
      balance: new Prisma.Decimal(0),
      totalTopUp: new Prisma.Decimal(0)
    }
  });
}

export async function creditWalletAtomic(input: WalletMutationInput) {
  return prisma.$transaction(async (tx) => creditWalletTx(tx, input));
}

export async function debitWalletAtomic(input: WalletMutationInput) {
  return prisma.$transaction(async (tx) => debitWalletTx(tx, input));
}

export async function creditWalletTx(tx: TxClient, input: WalletMutationInput) {
  const wallet = await ensureVendorWallet(input.vendorId, tx);
  const balanceAfter = new Prisma.Decimal(wallet.balance).plus(input.amount);
  const totalTopUp =
    input.type === 'TOP_UP'
      ? new Prisma.Decimal(wallet.totalTopUp).plus(input.amount)
      : new Prisma.Decimal(wallet.totalTopUp);

  const updatedWallet = await tx.vendorWallet.update({
    where: { id: wallet.id },
    data: {
      balance: balanceAfter,
      totalTopUp
    }
  });

  const transaction = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: input.type,
      amount: input.amount,
      balanceAfter,
      description: input.description
    }
  });

  return { wallet: updatedWallet, transaction };
}

export async function debitWalletTx(tx: TxClient, input: WalletMutationInput) {
  const wallet = await ensureVendorWallet(input.vendorId, tx);
  const currentBalance = new Prisma.Decimal(wallet.balance);

  if (!input.allowOverdraft && currentBalance.lt(input.amount)) {
    throw Object.assign(new Error('Insufficient wallet balance'), { statusCode: 409 });
  }

  const balanceAfter = currentBalance.minus(input.amount);
  const updatedWallet = await tx.vendorWallet.update({
    where: { id: wallet.id },
    data: { balance: balanceAfter }
  });

  const transaction = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: input.type,
      amount: input.amount.negated(),
      balanceAfter,
      description: input.description
    }
  });

  return { wallet: updatedWallet, transaction };
}

export function canOverdraft(role?: UserRole) {
  return role === 'SUPER_ADMIN';
}
