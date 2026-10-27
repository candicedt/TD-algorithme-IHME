
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Récupérer les réservations enregistrées
export async function GET() {
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

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur de lecture des réservations :", error);

    return NextResponse.json(
      { error: "Impossible de récupérer les réservations." },
      { status: 500 }
    );
  }
}

// Créer une réservation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { machineId, date, start, end, reservedBy } = body;

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
      return NextResponse.json(
        { error: "Les informations de réservation sont invalides." },
        { status: 400 }
      );
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

    return NextResponse.json(
      { id: result.rows[0].id, message: "Réservation créée." },
      { status: 201 }
    );
  } catch (error: unknown) {
    const dbError = error as { code?: string };

    // La base interdit déjà les chevauchements
    if (dbError.code === "23P01") {
      return NextResponse.json(
        { error: "Ce créneau est déjà réservé pour cette machine." },
        { status: 409 }
      );
    }

    console.error("Erreur de création de réservation :", error);

    return NextResponse.json(
      { error: "Impossible de créer la réservation." },
      { status: 500 }
    );
  }
}
