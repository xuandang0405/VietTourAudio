const mysql = require('c:/Users/UNITY/Desktop/VietTourAudio-project-ready-database-integration/viettour-admin-api/node_modules/mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'viettuoraudio'
  });

  try {
    console.log('Altering pois status enum...');
    await connection.execute(`
      ALTER TABLE pois 
      MODIFY COLUMN status ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED', 'HIDDEN') NOT NULL DEFAULT 'ACTIVE'
    `);
    console.log('Alter complete successfully!');
  } catch (error) {
    console.error('Error during alter:', error);
  } finally {
    await connection.end();
  }
}

run();
