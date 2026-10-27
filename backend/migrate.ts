import { db } from "./db";

export async function migrate() {
  // Nécessaire pour empêcher les réservations qui se chevauchent.
  await db.query("CREATE EXTENSION IF NOT EXISTS btree_gist");

  await db.query(`
    CREATE TABLE IF NOT EXISTS machines (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      machine_id BIGINT NOT NULL REFERENCES machines(id),
      reserved_by TEXT NOT NULL,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      CHECK (end_time > start_time),
      EXCLUDE USING gist (
        machine_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
      )
    )
  `);

  const machines = [
    [
      "Banc Bélier",
      "Banc d’impact à énergie variable de 0 à 1,5 J, pour des impacts répétés ou uniques sur des échantillons de cordage ou de mousse."
    ],
    [
      "Banc Puissance",
      "Banc d’impact à haute énergie sur des échantillons complets : mousse, cordage ou raquette."
    ],
    [
      "Banc Fatigue",
      "Banc d’impacts répétés permettant de mesurer le nombre de cycles avant rupture."
    ],
    [
      "Banc Mesures dimensionnelles",
      "Mesure des caractéristiques dimensionnelles des échantillons : masse, longueur, hauteur, etc."
    ],
    [
      "Dynamomètre Shimadzu",
      "Réalisation d’essais mécaniques de traction, compression, flexion, etc."
    ],
    [
      "Dynamomètre Instron",
      "Réalisation d’essais mécaniques de traction, compression, flexion, etc."
    ],
    [
      "Banc Rebond",
      "Mesure de la hauteur de balle après un rebond."
    ]
  ];

  for (const [name, description] of machines) {
    await db.query(
      `INSERT INTO machines (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING`,
      [name, description]
    );
  }

  console.log("Migration de la base de données terminée.");
}
