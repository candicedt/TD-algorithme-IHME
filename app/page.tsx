
"use client";

import { useState } from "react";

const machines = [
  { id: 1, name: "Machine de traction", location: "Laboratoire mécanique" },
  { id: 2, name: "Banc de flexion", location: "Laboratoire essais" },
  { id: 3, name: "Machine d'impact", location: "Laboratoire matériaux" },
];

const initialReservations = [
  {
    id: 1,
    machineId: 1,
    date: "2026-10-26",
    start: "10:00",
    end: "11:00",
    user: "Utilisateur démo",
  },
];

export default function Home() {
  const [reservations, setReservations] = useState(initialReservations);
  const [machineId, setMachineId] = useState("1");
  const [date, setDate] = useState("2026-10-26");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [message, setMessage] = useState("");

  function bookMachine(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (start >= end) {
      setMessage("L'heure de fin doit être après l'heure de début.");
      return;
    }

    const conflict = reservations.some(
      (reservation) =>
        reservation.machineId === Number(machineId) &&
        reservation.date === date &&
        start < reservation.end &&
        end > reservation.start
    );

    if (conflict) {
      setMessage("Ce créneau est déjà réservé pour cette machine.");
      return;
    }

    setReservations([
      ...reservations,
      {
        id: Date.now(),
        machineId: Number(machineId),
        date,
        start,
        end,
        user: "Utilisateur démo",
      },
    ]);

    setMessage("Réservation ajoutée avec succès !");
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
                  {machine.location}
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
                  <th className="p-4">Date</th>
                  <th className="p-4">Créneau</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="border-t border-slate-200">
                    <td className="p-4">
                      {machines.find(
                        (machine) => machine.id === reservation.machineId
                      )?.name}
                    </td>
                    <td className="p-4">{reservation.date}</td>
                    <td className="p-4">
                      {reservation.start} – {reservation.end}
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-slate-500">
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
