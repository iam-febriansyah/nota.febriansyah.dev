/* eslint-disable @typescript-eslint/no-explicit-any */
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cashback',
};

export async function executeQuery<T>(query: string, values: any[] = []): Promise<T> {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [results] = await connection.query(query, values);
    return results as T;
  } finally {
    await connection.end();
  }
}

// Transaction helper
export async function withTransaction<T>(callback: (connection: mysql.Connection) => Promise<T>): Promise<T> {
  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}
