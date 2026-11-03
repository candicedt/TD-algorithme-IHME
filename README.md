# LabFlow — Réservation des équipements du laboratoire

Application web de réservation partagée des machines du laboratoire. Le projet utilise **React + Vite**, **Express** et **PostgreSQL**. Le dossier Next.js historique présent à la racine n'est pas utilisé par le Dockerfile de déploiement.

## Fonctionnalités

- Création de compte et connexion par identifiant et mot de passe.
- Mots de passe stockés sous forme de dérivés `scrypt` salés ; session persistante en cookie `HttpOnly`, `SameSite=Lax` et `Secure` en production.
- Planning commun : tous les utilisateurs peuvent consulter les réservations de l'équipe.
- Vue Gantt journalière et vue hebdomadaire, avec une ligne par équipement.
- Réservations colorées selon leur propriétaire ; clic pour consulter les détails.
- Création d'une réservation avec campagne, machine, nombre d'échantillons, date et horaires.
- Seul le propriétaire connecté peut modifier ou supprimer sa réservation (contrôle côté serveur).
- La contrainte PostgreSQL empêche les chevauchements sur une même machine.
- Fiches des sept équipements, descriptions et visuels illustratifs.
- Interface responsive pour ordinateur, tablette et mobile.

## Important : première utilisation

L'inscription est ouverte : chaque membre de l'équipe crée son propre compte depuis l'écran de connexion. Choisissez un identifiant unique (3 à 30 caractères : lettres minuscules, chiffres, point, tiret ou underscore) et un mot de passe d'au moins 10 caractères.

Les anciennes réservations sont conservées lors de la migration. Elles apparaissent comme **Ancienne réservation** avec leur ancien nom (`reserved_by`), mais elles n'ont pas de propriétaire associé : elles sont donc consultables et ne peuvent pas être modifiées ou supprimées depuis l'interface. Les nouvelles réservations sont rattachées au compte connecté.

## Installation locale

Prérequis : Node.js 20+ (Node 24 recommandé), npm et Docker Desktop.

1. Définir `POSTGRES_PASSWORD` dans un fichier `.env` à la racine du projet :

   ```env
   POSTGRES_PASSWORD=choisir-un-mot-de-passe-postgresql
   ```

2. Créer `.env.local` à la racine du projet :

   ```env
   DATABASE_URL=postgresql://lab_app:choisir-un-mot-de-passe-postgresql@localhost:5432/lab_reservations
   ```

   Remplacer le mot de passe par la même valeur que dans `.env`. Ne jamais publier ces fichiers.

3. Démarrer PostgreSQL :

   ```bash
   docker compose up -d db
   ```

4. Dans un terminal, démarrer le backend :

   ```bash
   cd backend
   npm ci
   npm run dev
   ```

5. Dans un second terminal, démarrer le frontend :

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

Ouvrir l'adresse affichée par Vite (généralement `http://localhost:5173`). Le proxy Vite transmet les appels `/api` au backend sur le port 3001.

Au démarrage du backend, `migrate.ts` applique automatiquement les ajouts de schéma. La migration est additive et peut être relancée sans supprimer les données existantes.

## Déploiement Docker

Le `Dockerfile` construit l'interface Vite puis la sert avec Express. Le serveur attend une variable `DATABASE_URL` fournie par l'environnement de production. Le chemin de base Vite est configurable via l'argument `BASE_PATH` (valeur actuelle du déploiement de cours : `/td-algorithme-ihme/`).

Le workflow GitHub Actions `.github/workflows/publish.yml` construit et publie l'image sur GitHub Container Registry à chaque push sur `main`/`master`. Le déploiement sur le serveur de cours est déclenché séparément depuis l'onglet **Actions** avec l'option de déploiement activée, si les variables et secrets de déploiement du dépôt sont configurés.

## API

- `GET /api/health` — état du serveur.
- `GET /api/health/db` — état de la connexion PostgreSQL.
- `POST /api/auth/register` — création d'un compte.
- `POST /api/auth/login` — connexion.
- `GET /api/auth/me` — compte de la session courante.
- `POST /api/auth/logout` — déconnexion.
- `GET /api/machines` — liste des équipements.
- `GET /api/reservations` — planning commun (lecture publique).
- `POST /api/reservations` — créer une réservation (connexion requise).
- `PUT /api/reservations/:id` — modifier sa réservation (propriétaire uniquement).
- `DELETE /api/reservations/:id` — supprimer sa réservation (propriétaire uniquement).

## Structure principale

```text
frontend/                 Interface React + Vite
  src/App.tsx              Authentification, planning Gantt, formulaires et fiches machines
  src/App.css              Styles de l'interface
backend/                  API Express et accès PostgreSQL
  auth.ts                  Sessions et vérification des mots de passe
  migrate.ts               Migration additive de la base
  routes/auth.ts           Inscription / connexion / déconnexion
  routes/reservations.ts   CRUD avec contrôle de propriété
  routes/machines.ts       Lecture des équipements
Dockerfile                Construction et exécution en production
```

## Sécurité et limites

- Ne partagez jamais `.env`, `.env.local`, les mots de passe ou les jetons GitHub.
- Les mots de passe ne sont jamais stockés en clair.
- Les actions de modification et suppression sont protégées côté API, pas seulement dans l'interface.
- L'inscription est actuellement ouverte à toute personne pouvant atteindre l'application. Pour un déploiement réservé à une équipe fermée, prévoir ensuite une invitation administrateur ou une liste d'identifiants autorisés.
- Les photos des fiches machines sont des visuels illustratifs distants ; elles peuvent nécessiter une connexion Internet. Elles ne sont pas des photos certifiées des machines réelles.
