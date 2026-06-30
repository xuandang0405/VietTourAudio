const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/viettour-admin-api/.env') });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'viettuoraudio'
  });

  console.log('Connected to MySQL database:', process.env.DB_NAME || 'viettuoraudio');

  console.log('Creating system_tickets table...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS system_tickets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      sender_email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('PENDING', 'PROCESSED') NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_system_tickets_status (status),
      KEY idx_system_tickets_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('system_tickets table checked/created.');

  await connection.end();
}

run().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
