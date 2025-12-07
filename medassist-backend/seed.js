import { pool } from "./db.js";
import { v4 as uuidv4 } from "uuid";
async function seed(){
  // doctors
  await pool.query(`CREATE TABLE IF NOT EXISTS doctors (id TEXT PRIMARY KEY, name TEXT, specialty TEXT)`);
  const docs = [
    ["doc1","Dr. Asha Patel","General Physician"],
    ["doc2","Dr. Raj Kumar","Dermatology"],
    ["doc3","Dr. Leela Iyer","ENT"]
  ];
  for(const d of docs) await pool.query("INSERT INTO doctors(id,name,specialty) VALUES($1,$2,$3) ON CONFLICT DO NOTHING", d);
  // sample visitors
  const v = await pool.query("INSERT INTO visitors(name,email,phone,created_at) VALUES($1,$2,$3,NOW()) ON CONFLICT (email) DO NOTHING RETURNING id", ["Test User","test@example.com","9999999999"]);
  const vid = v.rows[0] ? v.rows[0].id : (await pool.query("SELECT id FROM visitors WHERE email=$1",["test@example.com"])).rows[0].id;
  const bid = uuidv4();
  await pool.query("INSERT INTO bookings(id,visitor_id,doctor_id,doctor_name,thirdparty_booking_id,service_type,timeslot,status,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) ON CONFLICT DO NOTHING",
    [bid, vid, "doc1","Dr. Asha Patel","cal-123","General Consultation", new Date().toISOString(), "booked"]);
  console.log("seed done");
  process.exit(0);
}
seed();