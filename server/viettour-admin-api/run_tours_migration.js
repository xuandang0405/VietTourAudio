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

  console.log('Connected to MySQL!');

  console.log('Running ALTER TABLE tours...');
  try {
    await connection.query("ALTER TABLE tours ADD COLUMN latitude DECIMAL(10,7) NULL, ADD COLUMN longitude DECIMAL(10,7) NULL;");
    console.log('Migration executed successfully!');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME' || err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
      console.log('Columns already exist. Skipping.');
    } else {
      throw err;
    }
  }

  await connection.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
