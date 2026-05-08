const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const dbPath = path.join(__dirname, "..", "data.sqlite");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS professionals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      water_intake_liters REAL,
      consent_terms INTEGER NOT NULL DEFAULT 0,
      lgpd_consent INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      extra_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS progress_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      entry_date TEXT NOT NULL,
      weight_kg REAL,
      measurements_json TEXT,
      load_notes TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

  const studentColumns = [
    ["whatsapp", "TEXT"],
    ["profession", "TEXT"],
    ["address_street", "TEXT"],
    ["address_number", "TEXT"],
    ["address_complement", "TEXT"],
    ["address_neighborhood", "TEXT"],
    ["address_city", "TEXT"],
    ["address_state", "TEXT"],
    ["address_zip", "TEXT"],
    ["emergency_contact_name", "TEXT"],
    ["emergency_contact_phone", "TEXT"],
    ["training_experience", "TEXT"],
    ["available_days", "TEXT"],
    ["preferred_shift", "TEXT"],
    ["medical_conditions", "TEXT"],
    ["medications", "TEXT"],
    ["allergies", "TEXT"],
    ["injuries_history", "TEXT"],
    ["surgeries_history", "TEXT"],
    ["pain_points", "TEXT"],
    ["physical_restrictions", "TEXT"],
    ["blood_pressure_history", "TEXT"],
    ["heart_disease_history", "TEXT"],
    ["diabetes_history", "TEXT"],
    ["family_history", "TEXT"],
    ["smoking_status", "TEXT"],
    ["alcohol_status", "TEXT"],
    ["sleep_hours", "TEXT"],
    ["stress_level", "TEXT"],
    ["dietary_habits", "TEXT"],
    ["water_intake_liters", "REAL"],
    ["consent_terms", "INTEGER NOT NULL DEFAULT 0"],
    ["lgpd_consent", "INTEGER NOT NULL DEFAULT 0"],
  ];

  const existingColumns = db
    .prepare("PRAGMA table_info(students)")
    .all()
    .map((column) => column.name);

  for (const [columnName, columnType] of studentColumns) {
    if (!existingColumns.includes(columnName)) {
      db.exec(`ALTER TABLE students ADD COLUMN ${columnName} ${columnType}`);
    }
  }
}

function seedAdmin() {
  const exists = db
    .prepare("SELECT id FROM professionals WHERE username = ?")
    .get("admin");

  if (!exists) {
    const passwordHash = bcrypt.hashSync("admin123", 10);
    db.prepare(
      "INSERT INTO professionals (username, password_hash, full_name, is_admin) VALUES (?, ?, ?, 1)"
    ).run("admin", passwordHash, "Administrador");

    console.log(
      "[SEED] Usuario admin criado: usuario=admin senha=admin123 (troque apos primeiro acesso)."
    );
  }
}

migrate();
seedAdmin();

module.exports = db;
