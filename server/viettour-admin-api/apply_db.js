const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function splitSql(sqlText) {
  const statements = [];
  let currentStatement = '';
  let inString = false;
  let stringChar = '';

  const lines = sqlText.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('--') || line.startsWith('#')) {
      continue;
    }
    
    if (currentStatement) currentStatement += ' ';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inString) {
        currentStatement += char;
        if (char === stringChar && line[i - 1] !== '\\') {
          inString = false;
        }
      } else if (char === "'" || char === '"' || char === '`') {
        inString = true;
        stringChar = char;
        currentStatement += char;
      } else if (char === ';') {
        statements.push(currentStatement.trim());
        currentStatement = '';
      } else {
        currentStatement += char;
      }
    }
  }
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  return statements.filter(s => s.length > 0);
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  console.log('Connected to MySQL server.');

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'viettuoraudio'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await connection.changeUser({ database: process.env.DB_NAME || 'viettuoraudio' });
  console.log(`Using database: ${process.env.DB_NAME || 'viettuoraudio'}`);

  console.log('Reading schema.sql...');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
  const schemaStatements = splitSql(schemaSql);
  console.log(`Running ${schemaStatements.length} statements from schema.sql...`);
  
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const stmt of schemaStatements) {
    try {
      await connection.query(stmt);
    } catch (err) {
      console.error(`Error executing statement:\n${stmt}\n`, err);
      throw err;
    }
  }
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('schema.sql applied successfully.');

  console.log('Reading seed.sql...');
  const seedSql = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');
  const seedStatements = splitSql(seedSql);
  console.log(`Running ${seedStatements.length} statements from seed.sql...`);
  
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const stmt of seedStatements) {
    try {
      await connection.query(stmt);
    } catch (err) {
      console.error(`Error executing statement:\n${stmt}\n`, err);
      throw err;
    }
  }
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('seed.sql applied successfully.');

  await connection.end();
  console.log('Database refresh completed successfully.');
}

run().catch(err => {
  console.error('Failed to apply database:', err);
  process.exit(1);
});
