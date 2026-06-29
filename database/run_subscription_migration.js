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

  const dbName = process.env.DB_NAME || 'viettuoraudio';
  console.log('Connected to MySQL database:', dbName);

  // Helper to check column existence
  async function columnExists(table, column) {
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [dbName, table, column]);
    return rows.length > 0;
  }

  const exists = await columnExists('Vendors', 'subscription_expiry_date');
  if (!exists) {
    console.log('Adding column subscription_expiry_date to Vendors table...');
    await connection.query('ALTER TABLE `Vendors` ADD COLUMN `subscription_expiry_date` DATETIME NULL;');
    console.log('Initializing subscription_expiry_date to created_at + 30 days...');
    await connection.query('UPDATE `Vendors` SET `subscription_expiry_date` = DATE_ADD(created_at, INTERVAL 30 DAY) WHERE `subscription_expiry_date` IS NULL;');
  } else {
    console.log('Column subscription_expiry_date already exists in Vendors table.');
  }

  console.log('Subscription migration completed successfully!');
  await connection.end();
}

run().catch(err => {
  console.error('Subscription migration failed:', err);
  process.exit(1);
});
