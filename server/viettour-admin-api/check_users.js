const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'viettuoraudio'
  });

  const [vpu] = await connection.query('SELECT * FROM vendor_portal_users');
  console.log('--- vendor_portal_users ---');
  console.log(vpu);

  const [vendors] = await connection.query('SELECT * FROM vendors');
  console.log('--- vendors ---');
  console.log(vendors);

  await connection.end();
}
run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
