# EFREI Rooms

Application web de réservation de salles pour les étudiants de l'EFREI.
Un étudiant réserve une salle sur n'importe quel campus, indique ce qu'il veut réviser, et les autres étudiants peuvent rejoindre son groupe (ouvert ou privé).

Projet d'Advanced Web Programming, 2026.
Auteurs : Augustin NANOUX & Aurélien DEVAUX-RIVIÈRE

## Technologies

| Partie | Technologie |
|---|---|
| Frontend | Vue.js 3 (Vite, Vue Router), HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| Base de données | MySQL, Sequelize (ORM) |
| Authentification | bcrypt (mots de passe), express-session (sessions stockées dans MySQL) |

## Prérequis

- Node.js 20 ou plus (testé avec la version 22) : https://nodejs.org
- MySQL Server 8 et MySQL Workbench
- Git

Vérification : `node -v` et `npm -v` doivent afficher un numéro de version.

## Installation

### 1. Récupérer le projet

```
git clone https://github.com/augustinnx/efrei-rooms.git
cd efrei-rooms
```

### 2. Créer la base de données

Dans MySQL Workbench, ouvrir un onglet de requête et exécuter :

```sql
CREATE DATABASE efrei_rooms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurer et lancer le backend

```
cd backend
npm install
```

Créer le fichier `.env` à partir du modèle :

- Mac / Linux : `cp .env.example .env`
- Windows : `copy .env.example .env`

Ouvrir `.env` et remplir :

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=le_mot_de_passe_mysql
DB_NAME=efrei_rooms
SESSION_SECRET=une_longue_phrase_aleatoire
PORT=3000
```

Créer les tables (migrations) puis insérer les données de départ (seeders) :

```
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

Lancer le serveur :

```
npm run dev
```

Résultat attendu :

```
Connexion à MySQL réussie
Serveur lancé sur http://localhost:3000
```

### 4. Lancer le frontend

Dans un **deuxième terminal** :

```
cd frontend
npm install
npm run dev
```

Ouvrir ensuite http://localhost:5173 dans le navigateur.

## Utilisation

1. Cliquer sur **Inscription** et créer un compte avec une adresse `@efrei.net` (mot de passe de 8 caractères minimum).
2. Après la connexion, la page d'accueil montre les permanences de la semaine et les groupes de révision des autres étudiants.
3. **Réserver une salle** ouvre le plan du campus : choisir un jour et une heure, cliquer sur une salle libre (bleue au survol), remplir le formulaire.
4. Une salle grise est occupée par un groupe ouvert : un clic permet de le rejoindre. Un cadenas rouge indique un groupe privé.
5. **Mes réservations** permet de modifier ou supprimer ses réservations.

### Créer un compte administrateur

Un compte admin ne peut pas être créé depuis le site (sécurité). Après s'être inscrit, exécuter dans MySQL Workbench :

```sql
SELECT id, email FROM efrei_rooms.Users;
UPDATE efrei_rooms.Users SET role = 'admin' WHERE id = 1;
```

Remplacer `1` par l'`id` du compte, puis se déconnecter et se reconnecter. Un admin peut créer des **permanences** (motif disponible dans le formulaire de réservation).

## Règles de réservation

- Heures pleines uniquement, de 8h à 20h, du lundi au vendredi.
- Pas de réservation dans le passé, et 7 jours maximum à l'avance.
- Une salle ne peut pas être réservée deux fois sur le même créneau (détection de conflit).
- Capacité maximale de 40 personnes par salle.
- Seul le créateur (ou un admin) peut modifier ou supprimer une réservation.
- Seul un admin peut créer une permanence.

## Structure du projet

```
efrei-rooms/
├── backend/
│   ├── config/         connexion à la base (database.js, config.js)
│   ├── models/         les 7 modèles Sequelize et leurs relations (index.js)
│   ├── controllers/    la logique : auth, salles, réservations
│   ├── routes/         les URL de l'API
│   ├── middleware/     requireAuth, requireAdmin
│   ├── migrations/     création des tables
│   ├── seeders/        données de départ (campus, matières, salles, profs)
│   └── server.js       point de départ du serveur
└── frontend/
    └── src/
        ├── views/        les pages
        ├── components/   composants réutilisables (BookingModal, AppFooter)
        ├── router/       les routes et le garde de connexion
        └── assets/       CSS et image
```

L'architecture backend suit le modèle **MVC** : les modèles (M) sont dans `models/`, la logique (C) dans `controllers/`, et la vue (V) est le frontend Vue qui affiche les données JSON de l'API.

## Base de données

7 tables liées, plus la table `Sessions` créée automatiquement par `connect-session-sequelize` :

- **Campuses** : les 4 campus
- **Users** : les comptes (mot de passe haché avec bcrypt, rôle `student` ou `admin`)
- **Rooms** : les salles, rattachées à un campus
- **Subjects** : les matières
- **Teachers** : les professeurs, rattachés à une matière
- **Bookings** : les réservations (salle, créateur, matière, date, heures, visibilité)
- **BookingParticipants** : table de liaison entre étudiants et réservations (relation plusieurs-à-plusieurs)

## API

Toutes les routes `/api/bookings` et `/api/auth/me` exigent d'être connecté.

| Méthode | URL | Rôle |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Utilisateur connecté |
| GET | `/api/rooms/campuses` | Liste des campus |
| GET | `/api/rooms?campusId=1` | Salles d'un campus |
| GET | `/api/rooms/subjects` | Liste des matières |
| GET | `/api/rooms/teachers` | Liste des professeurs |
| GET | `/api/bookings?campusId=1&date=AAAA-MM-JJ` | Réservations d'un jour |
| GET | `/api/bookings/mine` | Mes réservations |
| GET | `/api/bookings/upcoming` | Réservations des 7 prochains jours |
| GET | `/api/bookings/stats/subjects` | Matières les plus réservées |
| POST | `/api/bookings` | Créer une réservation |
| POST | `/api/bookings/:id/join` | Rejoindre une réservation |
| PUT | `/api/bookings/:id` | Modifier une réservation |
| DELETE | `/api/bookings/:id` | Supprimer une réservation |

## Sécurité

- Mots de passe hachés avec **bcrypt** (jamais stockés en clair).
- Validation des données **côté client** (formulaires Vue) **et côté serveur** (express-validator et règles métier).
- Requêtes **paramétrées** : Sequelize envoie les valeurs séparément de la requête SQL, ce qui protège contre l'injection SQL.
- Sessions stockées dans MySQL, cookie `httpOnly` et `sameSite`, signé avec `SESSION_SECRET`.
- Routes protégées côté serveur (`requireAuth`) et côté Vue (garde du routeur).
- Autorisation par rôle : les rôles ne sont jamais lus dans les requêtes, l'inscription force le rôle `student`.
- Le fichier `.env` n'est pas envoyé sur GitHub.

## Problèmes fréquents

- **`Access denied for user`** : le mot de passe de `DB_PASSWORD` dans `.env` est faux.
- **`Unknown database 'efrei_rooms'`** : la base n'a pas été créée (étape 2).
- **`Connexion à MySQL impossible`** : le serveur MySQL n'est pas démarré.
- **`Validation error` en lançant `db:seed:all`** : les seeders ont déjà été exécutés une fois.
- **Erreur à l'installation de `bcrypt`** : mettre Node.js à jour, puis supprimer le dossier `node_modules` et relancer `npm install`.







check list et idées a rajouter :




- logo insta/linkedin/mail sur le footer pour nous contacter (donc peut etre enlever le 'contactez nous')




GROS SOUCIS À REGLER :
- reserver une salle on ne voit pas les horraires possibles. pour le moment c'est juste un menu deroulant mais faudrait plutot qlq chose comme une barre avec en rouge les heures ou ya cours ou une reservation et en blanc les heurers dispo pour cette salles


Hors projet = pour la suite
- un bouton filtre pour directement filtrer kles salles dispo/campus/heures voulu/matiere/privée/public
- le noms des salles a faire extacfemenrt comme l'efrei
