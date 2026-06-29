ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS pending_key VARCHAR(64) NULL AFTER transfer_memo,
  ADD UNIQUE INDEX IF NOT EXISTS uq_payment_transactions_pending_key (pending_key);

-- Existing rows remain valid. Only newly initialized PENDING transactions
-- receive a pending_key, which is cleared when they are approved or rejected.
