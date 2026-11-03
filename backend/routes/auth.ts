import { Router } from "express";
import { db } from "../db";
import { clearCookie, createSession, hashPassword, requireAuth, verifyPassword } from "../auth";

const router = Router();
router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));
router.post("/register", async (req, res) => {
  try {
    const username = String(req.body.username ?? "").trim().toLowerCase();
    const displayName = String(req.body.displayName ?? "").trim();
    const password = String(req.body.password ?? "");
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) { res.status(400).json({ error: "L'identifiant doit contenir 3 à 30 caractères (lettres, chiffres, ., _ ou -)." }); return; }
    if (displayName.length < 2 || displayName.length > 60) { res.status(400).json({ error: "Indiquez un nom affiché de 2 à 60 caractères." }); return; }
    if (password.length < 10 || password.length > 200) { res.status(400).json({ error: "Le mot de passe doit contenir au moins 10 caractères." }); return; }
    const result = await db.query(
      "INSERT INTO users (username, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id, username, display_name AS \"displayName\"",
      [username, displayName, await hashPassword(password)]
    );
    const user = { id: Number(result.rows[0].id), username: result.rows[0].username, displayName: result.rows[0].displayName };
    await createSession(res, user.id);
    res.status(201).json({ user });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "23505") { res.status(409).json({ error: "Cet identifiant est déjà utilisé." }); return; }
    console.error("Erreur inscription :", error); res.status(500).json({ error: "Impossible de créer le compte." });
  }
});
router.post("/login", async (req, res) => {
  try {
    const username = String(req.body.username ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const result = await db.query("SELECT id, username, display_name AS \"displayName\", password_hash FROM users WHERE username = $1", [username]);
    if (!result.rowCount || !(await verifyPassword(password, result.rows[0].password_hash))) { res.status(401).json({ error: "Identifiant ou mot de passe incorrect." }); return; }
    const user = { id: Number(result.rows[0].id), username: result.rows[0].username, displayName: result.rows[0].displayName };
    await createSession(res, user.id); res.json({ user });
  } catch (error) { console.error("Erreur connexion :", error); res.status(500).json({ error: "Impossible de se connecter." }); }
});
router.post("/logout", async (req, res) => {
  const cookie = req.headers.cookie?.split(";").map((v) => v.trim()).find((v) => v.startsWith("lab_session="));
  if (cookie) {
    const token = decodeURIComponent(cookie.slice("lab_session=".length));
    const { createHash } = await import("node:crypto");
    await db.query("DELETE FROM user_sessions WHERE token_hash = $1", [createHash("sha256").update(token).digest("hex")]);
  }
  clearCookie(res); res.json({ message: "Déconnexion effectuée." });
});
export default router;
