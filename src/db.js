const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada. Configure para usar Postgres online.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "student-photos";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS professionals (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      birth_date TEXT,
      gender TEXT,
      profession TEXT,
      address_street TEXT,
      address_number TEXT,
      address_complement TEXT,
      address_neighborhood TEXT,
      address_city TEXT,
      address_state TEXT,
      address_zip TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      height_cm REAL,
      initial_weight_kg REAL,
      goal TEXT,
      training_experience TEXT,
      available_days TEXT,
      preferred_shift TEXT,
      medical_conditions TEXT,
      medications TEXT,
      allergies TEXT,
      injuries_history TEXT,
      surgeries_history TEXT,
      pain_points TEXT,
      physical_restrictions TEXT,
      blood_pressure_history TEXT,
      heart_disease_history TEXT,
      diabetes_history TEXT,
      family_history TEXT,
      smoking_status TEXT,
      alcohol_status TEXT,
      sleep_hours TEXT,
      stress_level TEXT,
      dietary_habits TEXT,
      water_intake_liters DOUBLE PRECISION,
      consent_terms BOOLEAN NOT NULL DEFAULT FALSE,
      lgpd_consent BOOLEAN NOT NULL DEFAULT FALSE,
      notes TEXT,
      extra_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS progress_entries (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL,
      entry_date TEXT NOT NULL,
      weight_kg DOUBLE PRECISION,
      measurements_json TEXT,
      load_notes TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL,
      workout_name TEXT NOT NULL,
      workout_date TEXT,
      muscle_group TEXT,
      exercises_json TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diets (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL,
      diet_name TEXT NOT NULL,
      start_date TEXT,
      meals_json TEXT NOT NULL,
      estimated_calories INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);
}

async function seedAdmin() {
  const exists = await query("SELECT id FROM professionals WHERE username = $1", ["admin"]);

  if (!exists.rowCount) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await query(
      "INSERT INTO professionals (username, password_hash, full_name, is_admin) VALUES ($1, $2, $3, TRUE)",
      ["admin", passwordHash, "Administrador"]
    );

    console.log(
      "[SEED] Usuario admin criado: usuario=admin senha=admin123 (troque apos primeiro acesso)."
    );
  }
}

async function initDb() {
  await migrate();
  await seedAdmin();
}

module.exports = {
  initDb,
  query,
  pool,
  supabase,
  storageBucket: STORAGE_BUCKET,
};
