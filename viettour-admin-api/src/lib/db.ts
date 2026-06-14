import 'dotenv/config';
import mysql, { PoolOptions, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

function buildPoolConfig(): string | PoolOptions {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'viettour_user',
    password: process.env.DB_PASSWORD ?? 'viettour_password',
    database: process.env.DB_NAME ?? process.env.MYSQL_DATABASE ?? 'viettuoraudio',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
    maxIdle: Number(process.env.DB_MAX_IDLE ?? 10),
    idleTimeout: Number(process.env.DB_IDLE_TIMEOUT ?? 60000),
    queueLimit: Number(process.env.DB_QUEUE_LIMIT ?? 0),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: 'Z'
  };
}

const poolConfig = buildPoolConfig();

export const pool = typeof poolConfig === 'string' ? mysql.createPool(poolConfig) : mysql.createPool(poolConfig);

export async function query<T extends RowDataPacket[] | RowDataPacket[][] | ResultSetHeader = RowDataPacket[]>(
  sql: string,
  params: unknown[] = []
): Promise<T> {
  const [rows] = await pool.execute<T>(sql, params as any[]);
  return rows;
}

export async function pingDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}
