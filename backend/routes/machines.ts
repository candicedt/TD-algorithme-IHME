
import { Router } from "express";
import { db } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, description FROM machines ORDER BY id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la lecture des machines :", error);
    res.status(500).json({
      error: "Impossible de récupérer les machines.",
    });
  }
});

export default router;
