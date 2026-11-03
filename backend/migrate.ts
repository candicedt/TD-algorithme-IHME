import { db } from "./db";

export async function migrate() {
  await db.query("CREATE EXTENSION IF NOT EXISTS btree_gist");
  await db.query(`CREATE TABLE IF NOT EXISTS machines (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id), reserved_by TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL, end_time TIMESTAMPTZ NOT NULL,
    CHECK (end_time > start_time),
    EXCLUDE USING gist (machine_id WITH =, tstzrange(start_time, end_time, '[)') WITH &&)
  )`);

  // Migration additive : aucune réservation existante n'est supprimée.
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.query("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS owner_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL");
  await db.query("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS campaign_name TEXT NOT NULL DEFAULT 'Ancienne réservation'");
  await db.query("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS sample_count INTEGER NOT NULL DEFAULT 1 CHECK (sample_count > 0)");

  const machines = [
    ["Banc Bélier", "Banc d’impact à énergie variable de 0 à 1,5 J, pour des impacts répétés ou uniques sur des échantillons de cordage ou de mousse."],
    ["Banc Puissance", "Banc d’impact à haute énergie sur des échantillons complets : mousse, cordage ou raquette."],
    ["Banc Fatigue", "Banc d’impacts répétés permettant de mesurer le nombre de cycles avant rupture."],
    ["Banc Mesures dimensionnelles", "Mesure des caractéristiques dimensionnelles des échantillons : masse, longueur, hauteur, etc."],
    ["Dynamomètre Shimadzu", "Réalisation d’essais mécaniques de traction, compression, flexion, etc."],
    ["Dynamomètre Instron", "Réalisation d’essais mécaniques de traction, compression, flexion, etc."],
    ["Banc Rebond", "Mesure de la hauteur de balle après un rebond."]
  ];
  for (const [name, description] of machines) {
    await db.query("INSERT INTO machines (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING", [name, description]);
  }
  await db.query("DELETE FROM user_sessions WHERE expires_at < NOW()");
  console.log("Migration de la base de données terminée (données existantes conservées).");
}
