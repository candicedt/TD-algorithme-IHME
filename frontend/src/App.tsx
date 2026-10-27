
import { useEffect, useState } from "react";
import "./App.css";

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

function App() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [reservedBy, setReservedBy] = useState("");
  const [machineId, setMachineId] = useState("");
  const [date, setDate] = useState("2026-10-27");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [message, setMessage] = useState("");

  async function fetchReservations() {
    const response = await fetch(`${import.meta.env.BASE_URL}api/reservations`);

    if (!response.ok) {
      throw new Error("Impossible de récupérer les réservations.");
    }

    const data: Reservation[] = await response.json();
    setReservations(data);
  }

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/machines`);

        if (!response.ok) {
          throw new Error("Impossible de récupérer les machines.");
        }

        const data: Machine[] = await response.json();

        const loadedMachines = data.map((machine) => ({
          ...machine,
          id: Number(machine.id),
        }));

        setMachines(loadedMachines);

        if (loadedMachines.length > 0) {
          setMachineId(String(loadedMachines[0].id));
        }

        await fetchReservations();
      } catch (error) {
        console.error(error);
        setMessage(
          "Impossible de charger les données. Vérifie que le backend Express fonctionne."
        );
      } finally {
        setLoadingMachines(false);
      }
    }

    loadData();
  }, []);

  async function bookMachine(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    if (start >= end) {
      setMessage("L'heure de fin doit être après l'heure de début.");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/reservations`, {
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

      await fetchReservations();
      setMessage("Réservation ajoutée avec succès !");
      setReservedBy("");
    } catch (error) {
      console.error(error);
      setMessage("Impossible de contacter le serveur. Réessaie.");
    }
  }

  return (
    <main className="page">
      <div className="container">
        <header className="page-header">
          <p className="eyebrow">
            Laboratoire · Gestion des équipements
          </p>
          <h1>Réservation des machines</h1>
          <p className="subtitle">
            Consultez les équipements et réservez un créneau disponible.
          </p>
        </header>

        <section className="section">
          <h2>Machines disponibles</h2>

          {loadingMachines && <p>Chargement des machines...</p>}

          <div className="machine-grid">
            {machines.map((machine) => (
              <article className="machine-card" key={machine.id}>
                <div className="machine-card-top">
                  <span className="muted">
                    Équipement {String(machine.id).padStart(2, "0")}
                  </span>
                  <span className="status">Actif</span>
                </div>

                <h3>{machine.name}</h3>
                <p className="description">
                  {machine.description ?? "Aucune description"}
                </p>

                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setMachineId(String(machine.id));
                    document
                      .getElementById("reservation")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Réserver cette machine →
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel section" id="reservation">
          <h2>Nouvelle réservation</h2>

          <form className="reservation-form" onSubmit={bookMachine}>
            <label>
              Nom du réservataire
              <input
                type="text"
                required
                value={reservedBy}
                onChange={(event) => setReservedBy(event.target.value)}
                placeholder="Prénom et nom"
              />
            </label>

            <label>
              Machine
              <select
                required
                value={machineId}
                onChange={(event) => setMachineId(event.target.value)}
              >
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            <label>
              Heure de début
              <input
                type="time"
                required
                value={start}
                onChange={(event) => setStart(event.target.value)}
              />
            </label>

            <label>
              Heure de fin
              <input
                type="time"
                required
                value={end}
                onChange={(event) => setEnd(event.target.value)}
              />
            </label>

            <button
              type="submit"
              className="primary-button"
              disabled={loadingMachines || machines.length === 0}
            >
              Confirmer la réservation
            </button>
          </form>

          {message && (
            <p
              role="status"
              className={`message ${
                message.includes("succès") ? "success" : "error"
              }`}
            >
              {message}
            </p>
          )}
        </section>

        <section className="section">
          <h2>Réservations enregistrées</h2>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Réservé par</th>
                  <th>Date</th>
                  <th>Créneau</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>{reservation.machineName}</td>
                    <td>{reservation.reservedBy}</td>
                    <td>{reservation.date}</td>
                    <td>
                      {reservation.start} – {reservation.end}
                    </td>
                  </tr>
                ))}

                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      Aucune réservation pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="footer-note">
          Les réservations sont enregistrées dans la base PostgreSQL.
        </p>
      </div>
    </main>
  );
}

export default App;
