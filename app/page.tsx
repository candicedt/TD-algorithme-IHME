
"use client";

import { useEffect, useState } from "react";

type Machine = {
  id: number;
  name: string;
  description: string | null;
};

type Reservation = {
  id: number | string;
  machineId: number | string;
  machineName: string;
  reservedBy: string;
  date: string;
  start: string;
  end: string;
};


export default function Home() {


const [machines, setMachines] = useState<Machine[]>([]);
const [loadingMachines, setLoadingMachines] = useState(true);
const [reservedBy, setReservedBy] = useState("");

useEffect(() => {
  async function fetchMachines() {
    try {
      console.log("Début du chargement des machines");

const response = await fetch("/api/machines");
console.log("Réponse API :", response.status);

if (!response.ok) {
  throw new Error("Impossible de récupérer les machines.");
}

const data: Machine[] = await response.json();
console.log("Machines reçues :", data);

setMachines(
  data.map((machine) => ({
    ...machine,
    id: Number(machine.id),
  }))
);
    } catch (error) {
      console.error("Erreur lors du chargement des machines :", error);
    } finally {
      setLoadingMachines(false);
    }
  }

  fetchMachines();
}, []);

useEffect(() => {
  async function fetchReservations() {
    try {
      const response = await fetch("/api/reservations");

      if (!response.ok) {
        throw new Error("Impossible de récupérer les réservations.");
      }

      const data: Reservation[] = await response.json();
      setReservations(data);
    } catch (error) {
      console.error("Erreur lors du chargement des réservations :", error);
    }
  }

  fetchReservations();
}, []);

const [reservations, setReservations] = useState<Reservation[]>([]);
  const [machineId, setMachineId] = useState("1");
  const [date, setDate] = useState("2026-10-26");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [message, setMessage] = useState("");

async function bookMachine(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setMessage("");

  if (start >= end) {
    setMessage("L'heure de fin doit être après l'heure de début.");
    return;
  }

  try {
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        machineId: Number(machineId),
        date,
        start,
        end,
        reservedBy,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.error ?? "Impossible d'enregistrer la réservation."
      );
      return;
    }

    setMessage("Réservation ajoutée avec succès !");
    setReservedBy("");

  } catch (error) {
    console.error("Erreur lors de la réservation :", error);
    setMessage("Impossible de contacter le serveur. Réessaie.");
  }
}

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Laboratoire · Gestion des équipements
          </p>
          <h1 className="mt-3 text-3xl font-bold">
            Réservation des machines
          </h1>
          <p className="mt-2 text-slate-600">
            Consultez les équipements et réservez un créneau disponible.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Machines disponibles</h2>
          {loadingMachines && (
  <p className="mb-4 text-sm text-slate-500">
    Chargement des machines...
  </p>
)}
          <div className="grid gap-4 md:grid-cols-3">
            {machines.map((machine) => (
              <article
                key={machine.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-500">
                    Équipement {String(machine.id).padStart(2, "0")}
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Actif
                  </span>
                </div>
                <h3 className="font-semibold">{machine.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {machine.description ?? "Aucune description"}
                </p>
                <button
                  onClick={() => {
                    setMachineId(String(machine.id));
                    document
                      .getElementById("reservation")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-5 text-sm font-semibold text-blue-700 hover:underline"
                >
                  Réserver cette machine →
                </button>
              </article>
            ))}
          </div>
        </section>

        <section
          id="reservation"
          className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-semibold">Nouvelle réservation</h2>

          <form onSubmit={bookMachine} className="grid gap-5 md:grid-cols-2">

  <label className="grid gap-2 text-sm font-medium">
    Nom du réservataire
    <input
      type="text"
      required
      value={reservedBy}
      onChange={(e) => setReservedBy(e.target.value)}
      placeholder="Prénom et nom"
      className="rounded-lg border border-slate-300 p-3"
    />
  </label>

            <label className="grid gap-2 text-sm font-medium">
              Machine
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="rounded-lg border border-slate-300 p-3"
              >
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Date
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-slate-300 p-3"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Heure de début
              <input
                type="time"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="rounded-lg border border-slate-300 p-3"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Heure de fin
              <input
                type="time"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="rounded-lg border border-slate-300 p-3"
              />
            </label>

            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 md:col-span-2"
            >
              Confirmer la réservation
            </button>
          </form>

          {message && (
            <p
              role="status"
              className={`mt-4 rounded-lg p-3 text-sm ${
                message.includes("succès")
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message}
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Réservations enregistrées
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="p-4">Machine</th>
                  <th className="p-4">Réservé par</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Créneau</th>
                </tr>
              </thead>
  <tbody>
  {reservations.map((reservation) => (
    <tr key={reservation.id} className="border-t border-slate-200">
      <td className="p-4">{reservation.machineName}</td>
      <td className="p-4">{reservation.reservedBy}</td>
      <td className="p-4">{reservation.date}</td>
      <td className="p-4">
        {reservation.start} – {reservation.end}
      </td>
    </tr>
  ))}

  {reservations.length === 0 && (
    <tr>
      <td colSpan={4} className="p-4 text-slate-500">
        Aucune réservation pour le moment.
      </td>
    </tr>
  )}
</tbody>
            </table>
          </div>
        </section>

        <p className="mt-8 text-xs text-slate-500">
          Prototype : les réservations sont conservées uniquement en mémoire
          et seront perdues au rechargement de la page.
        </p>
      </div>
    </main>
  );
}
