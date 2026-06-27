const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'viettuoraudio'
  });

  console.log('Connected to MySQL database:', process.env.DB_NAME || 'viettuoraudio');

  // 1. Create unlocked_tours table
  console.log('Creating unlocked_tours table...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS unlocked_tours (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guest_id VARCHAR(100) NOT NULL,
      tour_id INT NOT NULL,
      transaction_reference VARCHAR(100) NULL,
      unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_guest_tour (guest_id, tour_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('unlocked_tours table checked/created.');

  // Create payment_requests table
  console.log('Creating payment_requests table...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS payment_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guest_id VARCHAR(100) NOT NULL,
      tour_id INT NOT NULL,
      reference_code VARCHAR(100) NOT NULL UNIQUE,
      status VARCHAR(20) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('payment_requests table checked/created.');

  // Helper function to check if column exists
  async function columnExists(table, column) {
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [process.env.DB_NAME || 'viettuoraudio', table, column]);
    return rows.length > 0;
  }

  // 2. Add columns to pois
  const poisColumns = ['pending_name', 'pending_description', 'pending_cover_image_url', 'approval_status'];
  for (const col of poisColumns) {
    const exists = await columnExists('pois', col);
    if (!exists) {
      console.log(`Adding column ${col} to pois table...`);
      let definition = '';
      if (col === 'pending_name') definition = 'VARCHAR(255) NULL';
      if (col === 'pending_description') definition = 'TEXT NULL';
      if (col === 'pending_cover_image_url') definition = 'VARCHAR(500) NULL';
      if (col === 'approval_status') definition = "VARCHAR(50) NOT NULL DEFAULT 'APPROVED'";
      await connection.query(`ALTER TABLE pois ADD COLUMN ${col} ${definition};`);
    } else {
      console.log(`Column ${col} already exists in pois table.`);
    }
  }

  // 3. Add columns to zones
  for (const col of poisColumns) {
    const exists = await columnExists('zones', col);
    if (!exists) {
      console.log(`Adding column ${col} to zones table...`);
      let definition = '';
      if (col === 'pending_name') definition = 'VARCHAR(255) NULL';
      if (col === 'pending_description') definition = 'TEXT NULL';
      if (col === 'pending_cover_image_url') definition = 'VARCHAR(500) NULL';
      if (col === 'approval_status') definition = "VARCHAR(50) NOT NULL DEFAULT 'APPROVED'";
      await connection.query(`ALTER TABLE zones ADD COLUMN ${col} ${definition};`);
    } else {
      console.log(`Column ${col} already exists in zones table.`);
    }
  }

  // Check and add columns to tours table
  const toursCols = ['start_date', 'end_date', 'type', 'price', 'code'];
  for (const col of toursCols) {
    const exists = await columnExists('tours', col);
    if (!exists) {
      console.log(`Adding column ${col} to tours table...`);
      let definition = '';
      if (col === 'start_date') definition = 'DATETIME NULL';
      if (col === 'end_date') definition = 'DATETIME NULL';
      if (col === 'type') definition = "ENUM('NORMAL', 'FESTIVAL') NOT NULL DEFAULT 'NORMAL'";
      if (col === 'price') definition = 'DECIMAL(14,2) NOT NULL DEFAULT 0.00';
      if (col === 'code') definition = 'VARCHAR(100) UNIQUE NULL';
      await connection.query(`ALTER TABLE tours ADD COLUMN ${col} ${definition};`);
    } else {
      console.log(`Column ${col} already exists in tours table.`);
    }
  }

  // 4. Ensure VietQR Napas configuration exists in app_settings
  const [settings] = await connection.query(`
    SELECT * FROM app_settings WHERE \`key\` = 'PREMIUM_PAYMENT_QR'
  `);
  if (settings.length === 0) {
    console.log('Seeding PREMIUM_PAYMENT_QR setting...');
    await connection.query(`
      INSERT INTO app_settings (\`key\`, \`value\`)
      VALUES ('PREMIUM_PAYMENT_QR', '970403:123456789:NHOM_VTA:NGUYEN VAN A')
    `);
  }

  // Update premium tours price to 30000.00
  console.log('Setting prices for premium tours...');
  await connection.query(`
    UPDATE tours SET price = 30000.00 WHERE is_premium = 1;
  `);

  console.log('Database migrations completed successfully!');
  await connection.end();
}

run().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
