# Gestion des réservations – Machines de laboratoire

Cette application web permet de gérer et de réserver des machines d'essais d'un laboratoire. Elle permet aux utilisateurs de consulter les disponibilités des équipements, de réserver des créneaux et de suivre les campagnes d'essais réalisées sur les différentes machines.

L'objectif est de centraliser les réservations dans un planning partagé afin de faciliter l'organisation des essais et d'éviter les conflits d'utilisation des équipements.

## 1. Fonctionnalités principales

### Gestion des utilisateurs

Chaque utilisateur dispose de son propre compte, avec :
- Un identifiant personnel (nom d'utilisateur).
- Un mot de passe.
- Une session de connexion permettant de retrouver ses réservations.

Les droits d'accès sont les suivants :
- Tous les utilisateurs connectés peuvent consulter l'ensemble des réservations.
- Chaque utilisateur peut créer ses propres réservations.
- Un utilisateur peut modifier ou supprimer uniquement les réservations dont il est propriétaire.
- Les réservations des autres utilisateurs restent consultables, mais ne peuvent pas être modifiées.

La gestion des droits est assurée côté serveur afin d'empêcher toute modification non autorisée.

### Réservation d'une machine

Chaque réservation comprend les informations suivantes :
- **Utilisateur :** personne à l'origine de la réservation.
- **Machine :** équipement utilisé.
- **Date et horaires :** début et fin du créneau réservé.
- **Campagne d'essai :** nom ou référence de la campagne associée à l'essai.
- **Nombre d'échantillons :** quantité d'échantillons prévue pour la campagne.

Les réservations doivent respecter les disponibilités des machines. Deux réservations ne peuvent pas se chevaucher sur une même machine.

### Planning partagé – Vue Gantt

L'ensemble des réservations est accessible depuis un planning commun, sous forme de diagramme de Gantt ou d'emploi du temps.

Principes d'affichage :
- Une ligne correspond à une machine.
- Chaque réservation est représentée par un bloc positionné selon sa date et sa durée.
- Les blocs sont identifiables par une couleur associée à l'utilisateur.
- Les informations principales sont accessibles directement sur le planning ou en cliquant sur une réservation.
- Une navigation par jour et par semaine permet de visualiser les disponibilités.

Le planning est consultable par tous les utilisateurs, indépendamment du propriétaire des réservations.

### Interface graphique

L'application doit proposer une interface claire, moderne et intuitive :
- Page d'accueil présentant les différentes machines.
- Photographies des équipements pour faciliter leur identification.
- Fiches machines avec description et informations utiles.
- Accès rapide à la réservation depuis chaque fiche.
- Planning Gantt interactif.
- Formulaire de réservation simple et lisible.
- Affichage adapté aux ordinateurs et aux téléphones.

L'identité visuelle doit être cohérente avec un environnement technique et scientifique, tout en restant agréable à utiliser.

## 2. Architecture technique

Le projet repose sur une architecture client-serveur.

| Partie | Technologies | Rôle |
|---|---|---|
| Frontend | React, TypeScript, Vite | Interface utilisateur et planning |
| Backend | Node.js, Express, TypeScript | API, authentification et gestion des réservations |
| Base de données | PostgreSQL | Stockage des utilisateurs, machines et réservations |
| Conteneurisation | Docker | Déploiement de l'application |
| Hébergement | Serveur distant | Mise à disposition de l'application |
| Versionnement | Git et GitHub | Suivi des modifications du projet |

## 3. Base de données

La base de données PostgreSQL centralise les informations nécessaires au fonctionnement de l'application.

### Table `users`

Contient les informations des utilisateurs :
- `id` : identifiant unique.
- `username` : nom d'utilisateur unique.
- `password_hash` : mot de passe stocké sous forme hachée.
- `created_at` : date de création du compte.

Les mots de passe ne doivent jamais être enregistrés en clair.

### Table `machines`

Contient les équipements disponibles :
- `id` : identifiant unique.
- `name` : nom de la machine.
- `description` : description de l'équipement.
- `image_url` : chemin ou adresse de la photographie.
- `created_at` : date d'ajout.

### Table `reservations`

Contient les réservations effectuées :
- `id` : identifiant unique.
- `user_id` : utilisateur propriétaire de la réservation.
- `machine_id` : machine concernée.
- `start_time` : date et heure de début.
- `end_time` : date et heure de fin.
- `campaign_name` : nom de la campagne d'essai.
- `sample_count` : nombre d'échantillons.
- `created_at` : date de création.
- `updated_at` : date de dernière modification.

Les relations entre les tables permettent d'associer chaque réservation à un utilisateur et à une machine.

### Gestion des conflits de réservation

Une contrainte au niveau de PostgreSQL empêche deux réservations de se chevaucher pour une même machine.

Cette vérification est réalisée directement dans la base de données afin de garantir la cohérence des réservations, même lorsque plusieurs utilisateurs effectuent des demandes simultanément.

## 4. API Backend

Le backend repose sur une API REST développée avec Express et TypeScript.

Les principales routes prévues sont :

| Méthode | Route | Fonction |
|---|---|---|
| POST | `/api/auth/register` | Création d'un compte |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Informations sur l'utilisateur connecté |
| GET | `/api/machines` | Liste des machines |
| GET | `/api/reservations` | Consultation des réservations |
| POST | `/api/reservations` | Création d'une réservation |
| PUT | `/api/reservations/:id` | Modification d'une réservation personnelle |
| DELETE | `/api/reservations/:id` | Suppression d'une réservation personnelle |
| GET | `/api/health` | Vérification du serveur |
| GET | `/api/health/db` | Vérification de la connexion à la base de données |

Les routes de création, de modification et de suppression des réservations nécessitent une authentification.

Le serveur vérifie systématiquement que l'utilisateur connecté est bien propriétaire de la réservation avant d'autoriser une modification ou une suppression.

## 5. Interface Frontend

Le frontend est développé avec React et TypeScript.

Il est organisé autour de plusieurs vues principales :

**Page d'accueil**
- Présentation du laboratoire.
- Accès aux machines.
- Accès au planning des réservations.

**Page des machines**
- Présentation des équipements avec photographies.
- Description des machines.
- Accès au formulaire de réservation.

**Page de réservation**
- Sélection de la machine.
- Choix des dates et horaires.
- Saisie du nom de la campagne d'essai.
- Saisie du nombre d'échantillons.
- Confirmation de la réservation.

**Page planning**
- Vue Gantt avec une ligne par machine.
- Visualisation de toutes les réservations.
- Couleurs permettant de distinguer les utilisateurs.
- Consultation des détails d'une réservation.
- Modification ou suppression des réservations personnelles.

**Espace utilisateur**
- Identification et déconnexion.
- Consultation de ses propres réservations.
- Accès aux actions de modification et de suppression.

## 6. Structure du projet

```text
gestion-machines-laboratoire/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Composants graphiques
│   │   ├── pages/            # Pages de l'application
│   │   ├── services/         # Communication avec l'API
│   │   └── ...
│   ├── public/               # Images et ressources statiques
│   └── package.json
│
├── backend/
│   ├── server.ts             # Serveur Express et routes API
│   ├── db.ts                 # Connexion PostgreSQL
│   ├── migrate.ts            # Migrations de la base de données
│   └── ...
│
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── .env.local                # Variables locales non versionnées
├── README.md
└── ...
```

Cette structure est indicative et pourra évoluer avec l'ajout des fonctionnalités.

## 7. Installation et lancement en local

### Prérequis

- Node.js et npm.
- Docker Desktop.
- Git.
- PostgreSQL (ou une instance PostgreSQL accessible).

### Récupération du projet

```bash
git clone https://github.com/candicedt/TD-algorithme-IHME.git
cd TD-algorithme-IHME
```

### Configuration

Les paramètres de connexion à la base de données et les secrets de l'application doivent être définis dans un fichier d'environnement local.

Exemple de variable :

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

Ne jamais publier ce fichier ni les secrets dans GitHub.

### Lancement

Les commandes de lancement dépendent de la configuration des scripts npm et de Docker du projet.

Le frontend et le backend communiquent avec la base PostgreSQL via l'API.

## 8. Déploiement

L'application est hébergée sur un serveur distant et son déploiement est automatisé à l'aide de GitHub Actions et Docker.

Dépôt GitHub :

https://github.com/candicedt/TD-algorithme-IHME

Application en ligne :

https://node219697-ihme26.jcloud.ik-server.com/td-algorithme-ihme/

Le déploiement permet de mettre à jour l'application après les modifications du code et la validation de la nouvelle version.

## 9. Évolutions envisagées

Plusieurs améliorations pourront être ajoutées par la suite :
- Gestion des rôles administrateur et utilisateur.
- Ajout et modification des machines depuis une interface d'administration.
- Filtres par utilisateur, machine et campagne d'essai.
- Export des réservations au format Excel ou CSV.
- Historique des réservations.
- Notifications avant le début d'un essai.
- Statistiques d'utilisation des machines.
- Gestion des maintenances et des indisponibilités des équipements.

## 10. Objectif du projet

L'application a pour objectif de simplifier et de fiabiliser l'organisation des essais en laboratoire.

Elle doit permettre à chaque utilisateur de planifier ses campagnes d'essais, de connaître les disponibilités des équipements et de consulter l'activité globale du laboratoire, tout en conservant une gestion sécurisée et individualisée des réservations.
