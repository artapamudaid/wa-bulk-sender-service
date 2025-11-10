import dotenv from "dotenv";
dotenv.config(); // ✅ load .env duluan

import pg from "pg";
import logger from "./utils/logger.js";

const { Pool } = pg;

// ✅ Cek environment
["DB_HOST", "DB_PORT", "DB_USER", "DB_PASS", "DB_NAME"].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required env variable: ${key}`);
  }
});

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Tambahkan 👇  jika pakai postgresql
  options: '-c search_path=public'
});

pool.on("error", (err) => {
  logger.error("⚠️ Unexpected PG client error:", err);
});

/** Ambil semua sender aktif */
export async function getActiveSenders() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT DISTINCT sender
      FROM wa_queue
      WHERE status = 'pending'
    `);
    return res.rows.map((r) => r.sender);
  } finally {
    client.release();
  }
}

/** Hitung pesan pending per sender */
export async function getPendingCountForSender(sender) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT COUNT(*) AS count FROM wa_queue WHERE sender = $1 AND status = 'pending'`,
      [sender]
    );
    return parseInt(res.rows[0].count, 10);
  } finally {
    client.release();
  }
}
