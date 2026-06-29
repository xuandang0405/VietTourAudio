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

  // 1. Add pending translation columns to Pois
  const poisPendingTranslations = [
    { name: 'pending_name_en', def: 'VARCHAR(255) NULL' },
    { name: 'pending_name_ja', def: 'VARCHAR(255) NULL' },
    { name: 'pending_name_ko', def: 'VARCHAR(255) NULL' },
    { name: 'pending_name_zh', def: 'VARCHAR(255) NULL' },
    { name: 'pending_description_en', def: 'TEXT NULL' },
    { name: 'pending_description_ja', def: 'TEXT NULL' },
    { name: 'pending_description_ko', def: 'TEXT NULL' },
    { name: 'pending_description_zh', def: 'TEXT NULL' }
  ];

  for (const col of poisPendingTranslations) {
    const exists = await columnExists('pois', col.name);
    if (!exists) {
      console.log(`Adding column ${col.name} to Pois table...`);
      await connection.query(`ALTER TABLE \`pois\` ADD COLUMN \`${col.name}\` ${col.def};`);
    } else {
      console.log(`Column ${col.name} already exists in Pois table.`);
    }
  }

  // 2. Add translation columns to StallProducts
  const productsTranslations = [
    { name: 'product_name_en', def: 'VARCHAR(255) NULL' },
    { name: 'product_name_ja', def: 'VARCHAR(255) NULL' },
    { name: 'product_name_ko', def: 'VARCHAR(255) NULL' },
    { name: 'product_name_zh', def: 'VARCHAR(255) NULL' }
  ];

  for (const col of productsTranslations) {
    const exists = await columnExists('StallProducts', col.name);
    if (!exists) {
      console.log(`Adding column ${col.name} to StallProducts table...`);
      await connection.query(`ALTER TABLE \`StallProducts\` ADD COLUMN \`${col.name}\` ${col.def};`);
    } else {
      console.log(`Column ${col.name} already exists in StallProducts table.`);
    }
  }

  console.log('Database migrations completed successfully!');
  await connection.end();
}

run().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
