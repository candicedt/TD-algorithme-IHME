import path from "node:path";
import express from "express";
import cors from "cors";

import { db } from "./db";
import { migrate } from "./migrate";
import machinesRouter from "./routes/machines";
import reservationsRouter from "./routes/reservations";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend Express opérationnel" });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    const result = await db.query("SELECT current_database() AS database");
    res.json({ status: "ok", database: result.rows[0].database });
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

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.resolve(process.cwd(), "../dist");

  // Le serveur de l'école retire déjà le préfixe de l'URL.
  app.use(express.static(frontendPath));

  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api/") || path.extname(req.path)) {
      return next();
    }

    return res.sendFile(path.join(frontendPath, "index.html"));
  });
}

async function start() {
  try {
    await migrate();

    app.listen(PORT, () => {
      console.log(`Serveur Express démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error("Impossible de démarrer le serveur :", error);
    process.exitCode = 1;
    await db.end();
  }
}

void start();
