const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || viettuoraudio',
    multipleStatements: true
  });

  console.log('Connected to MySQL!');

  const sqlFile = path.join(__dirname, '..', 'database', 'migrations', '20260624-add-qr-deeplink-premium.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('Running migration...');
  await connection.query(sql);

  console.log('Migration executed successfully!');
  await connection.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
