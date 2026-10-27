
import { Router } from "express";
import { db } from "../db";

const router = Router();

// Récupérer les réservations
router.get("/", async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT
        r.id,
        r.machine_id AS "machineId",
        m.name AS "machineName",
        r.reserved_by AS "reservedBy",
        to_char(
          r.start_time AT TIME ZONE 'Europe/Paris',
          'YYYY-MM-DD'
        ) AS date,
        to_char(
          r.start_time AT TIME ZONE 'Europe/Paris',
          'HH24:MI'
        ) AS start,
        to_char(
          r.end_time AT TIME ZONE 'Europe/Paris',
          'HH24:MI'
        ) AS "end"
      FROM reservations r
      JOIN machines m ON m.id = r.machine_id
      ORDER BY r.start_time
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur de lecture des réservations :", error);
    res.status(500).json({
      error: "Impossible de récupérer les réservations.",
    });
  }
});

// Créer une réservation
router.post("/", async (req, res) => {
  try {
    const { machineId, date, start, end, reservedBy } = req.body;

    if (
      !Number.isInteger(Number(machineId)) ||
      !date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^\d{2}:\d{2}$/.test(start ?? "") ||
      !/^\d{2}:\d{2}$/.test(end ?? "") ||
      typeof reservedBy !== "string" ||
      !reservedBy.trim() ||
      start >= end
    ) {
      res.status(400).json({
        error: "Les informations de réservation sont invalides.",
      });
      return;
    }

    const result = await db.query(
      `
        INSERT INTO reservations (
          machine_id,
          reserved_by,
          start_time,
          end_time
        )
        VALUES (
          $1,
          $2,
          ($3::date + $4::time) AT TIME ZONE 'Europe/Paris',
          ($3::date + $5::time) AT TIME ZONE 'Europe/Paris'
        )
        RETURNING id
      `,
      [Number(machineId), reservedBy.trim(), date, start, end]
    );

    res.status(201).json({
      id: result.rows[0].id,
      message: "Réservation créée.",
    });
  } catch (error: unknown) {
    const dbError = error as { code?: string };

    if (dbError.code === "23P01") {
      res.status(409).json({
        error: "Ce créneau est déjà réservé pour cette machine.",
      });
      return;
    }

    console.error("Erreur de création de réservation :", error);
    res.status(500).json({
      error: "Impossible de créer la réservation.",
    });
  }
});

export default router;
