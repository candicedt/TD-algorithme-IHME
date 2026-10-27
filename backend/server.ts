import path from "node:path";
import fs from "node:fs";
import express from "express";

import cors from "cors";
import { db } from "./db";
import machinesRouter from "./routes/machines";
import reservationsRouter from "./routes/reservations";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// En production, servir l'interface React compilée.

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.resolve(process.cwd(), "../dist");
  const basePath = "/td-algorithme-ihme";

  // Servir les fichiers React sous le chemin de l'application.
  app.use(basePath, express.static(frontendPath));

  // Afficher React pour les autres pages de l'application.
  app.get(`${basePath}/{*path}`, (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    const indexPath = path.join(frontendPath, "index.html");

    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }

    return next();
  });
}


app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend Express opérationnel" });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    const result = await db.query("SELECT current_database() AS database");
    res.json({
      status: "ok",
      database: result.rows[0].database,
    });
  } catch (error) {
    console.error("Erreur de connexion PostgreSQL :", error);
    res.status(500).json({
      status: "error",
      message: "Connexion à PostgreSQL impossible",
    });
  }
});

app.use("/api/machines", machinesRouter);
app.use("/api/reservations", reservationsRouter);

app.listen(PORT, () => {
  console.log(`Serveur Express démarré sur http://localhost:${PORT}`);
});
