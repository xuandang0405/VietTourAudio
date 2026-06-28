CREATE TABLE IF NOT EXISTS admin_payment_configs (
  id INT NOT NULL AUTO_INCREMENT,
  gateway_type VARCHAR(20) NOT NULL,
  account_name VARCHAR(255) NOT NULL DEFAULT '',
  account_number VARCHAR(120) NOT NULL DEFAULT '',
  qr_code_url VARCHAR(600) NULL,
  transfer_memo_pattern VARCHAR(255) NOT NULL DEFAULT 'VTA PREMIUM [Id]',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_payment_configs_gateway_type (gateway_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_transactions (
  id CHAR(36) NOT NULL,
  sender_id VARCHAR(160) NOT NULL,
  sender_type VARCHAR(20) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  transaction_type VARCHAR(40) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  transfer_memo VARCHAR(255) NOT NULL,
  proof_attachment_url VARCHAR(600) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_transactions_transfer_memo (transfer_memo),
  KEY idx_payment_transactions_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO admin_payment_configs
  (gateway_type, account_name, account_number, transfer_memo_pattern, is_active)
VALUES
  ('MOMO', 'VietTourAudio MoMo', '', 'VTA [Type] [Id]', 1),
  ('BANK', 'VietTourAudio', '', 'VTA [Type] [Id]', 1),
  ('VISA', 'VietTourAudio Card Gateway', 'VISA', 'VTA VISA [Id]', 1)
ON DUPLICATE KEY UPDATE gateway_type = VALUES(gateway_type);
