import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../auth";
const router = Router();

const SELECT_RESERVATIONS = `SELECT r.id, r.machine_id AS "machineId", m.name AS "machineName",
  r.reserved_by AS "reservedBy", r.owner_user_id AS "ownerUserId",
  u.display_name AS "ownerDisplayName", r.campaign_name AS "campaignName", r.sample_count AS "sampleCount",
  to_char(r.start_time AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD') AS date,
  to_char(r.start_time AT TIME ZONE 'Europe/Paris', 'HH24:MI') AS start,
  to_char(r.end_time AT TIME ZONE 'Europe/Paris', 'HH24:MI') AS "end"
  FROM reservations r JOIN machines m ON m.id = r.machine_id LEFT JOIN users u ON u.id = r.owner_user_id`;

function validInput(body: Record<string, unknown>) {
  const { machineId, date, start, end, campaignName, sampleCount } = body;
  return Number.isInteger(Number(machineId)) && Number(machineId) > 0 &&
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    typeof start === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(start) &&
    typeof end === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(end) && start < end &&
    typeof campaignName === "string" && campaignName.trim().length >= 2 && campaignName.trim().length <= 100 &&
    Number.isInteger(Number(sampleCount)) && Number(sampleCount) >= 1 && Number(sampleCount) <= 100000;
}
function handleDbError(error: unknown, res: import("express").Response) {
  const code = (error as { code?: string }).code;
  if (code === "23P01") { res.status(409).json({ error: "Ce créneau est déjà réservé pour cette machine." }); return; }
  if (code === "23503") { res.status(400).json({ error: "Cette machine n'existe pas." }); return; }
  console.error("Erreur réservation :", error); res.status(500).json({ error: "Une erreur est survenue lors de l'enregistrement." });
}
router.get("/", async (_req, res) => {
  try { const result = await db.query(`${SELECT_RESERVATIONS} ORDER BY r.start_time`); res.json(result.rows); }
  catch (error) { console.error("Erreur lecture réservations :", error); res.status(500).json({ error: "Impossible de récupérer les réservations." }); }
});
router.post("/", requireAuth, async (req, res) => {
  if (!validInput(req.body)) { res.status(400).json({ error: "Vérifiez la machine, les dates, les horaires, la campagne et le nombre d'échantillons." }); return; }
  try {
    const { machineId, date, start, end, campaignName, sampleCount } = req.body;
    const result = await db.query(`INSERT INTO reservations (machine_id, reserved_by, owner_user_id, campaign_name, sample_count, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5, ($6::date + $7::time) AT TIME ZONE 'Europe/Paris', ($6::date + $8::time) AT TIME ZONE 'Europe/Paris') RETURNING id`,
      [Number(machineId), req.user!.displayName, req.user!.id, campaignName.trim(), Number(sampleCount), date, start, end]);
    res.status(201).json({ id: result.rows[0].id, message: "Réservation créée." });
  } catch (error) { handleDbError(error, res); }
});
router.put("/:id", requireAuth, async (req, res) => {
  if (!/^\d+$/.test(req.params.id) || !validInput(req.body)) { res.status(400).json({ error: "Informations de modification invalides." }); return; }
  try {
    const { machineId, date, start, end, campaignName, sampleCount } = req.body;
    const result = await db.query(`UPDATE reservations SET machine_id=$1, campaign_name=$2, sample_count=$3,
      start_time=($4::date + $5::time) AT TIME ZONE 'Europe/Paris', end_time=($4::date + $6::time) AT TIME ZONE 'Europe/Paris'
      WHERE id=$7 AND owner_user_id=$8 RETURNING id`,
      [Number(machineId), campaignName.trim(), Number(sampleCount), date, start, end, req.params.id, req.user!.id]);
    if (!result.rowCount) { res.status(404).json({ error: "Réservation introuvable ou vous n'en êtes pas propriétaire." }); return; }
    res.json({ message: "Réservation modifiée." });
  } catch (error) { handleDbError(error, res); }
});
router.delete("/:id", requireAuth, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) { res.status(400).json({ error: "Identifiant invalide." }); return; }
  try {
    const result = await db.query("DELETE FROM reservations WHERE id=$1 AND owner_user_id=$2 RETURNING id", [req.params.id, req.user!.id]);
    if (!result.rowCount) { res.status(404).json({ error: "Réservation introuvable ou vous n'en êtes pas propriétaire." }); return; }
    res.json({ message: "Réservation supprimée." });
  } catch (error) { handleDbError(error, res); }
});
export default router;
