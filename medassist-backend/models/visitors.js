// models/visitors.js
import { pool } from "../db.js";

export async function findOrCreateVisitor({ name, email, phone }) {
  const client = await pool.connect();
  try {
    // try find by email or phone
    const res = await client.query(
      `SELECT * FROM visitors WHERE email = $1 OR phone = $2 LIMIT 1`,
      [email, phone]
    );
    if (res.rows.length) return res.rows[0];

    const insert = await client.query(
      `INSERT INTO visitors (name,email,phone) VALUES ($1,$2,$3) RETURNING *`,
      [name, email, phone]
    );
    return insert.rows[0];
  } finally {
    client.release();
  }
}

export async function getVisitorByEmail(email) {
  const { rows } = await pool.query(`SELECT * FROM visitors WHERE email=$1 LIMIT 1`, [email]);
  return rows[0];
}