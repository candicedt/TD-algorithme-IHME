import { NextResponse } from "next/server";
import { db } from "@/lib/db";


export async function GET() {
  try {
    const result = await db.query(
      "SELECT id, name, description FROM machines ORDER BY id"
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la lecture des machines :", error);

    return NextResponse.json(
      { error: "Impossible de récupérer les machines." },
      { status: 500 }
    );
  }
}