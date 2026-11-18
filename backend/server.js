require('dotenv').config(); // charge le fichier .env en premier
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./config/database');
require('./models'); // charge les 7 modèles et leurs relations

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');

const app = express();

// Autorise le frontend Vue (port 5173) à appeler cette API, cookies compris
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
// Permet de lire le JSON envoyé dans les requêtes
app.use(express.json());

// Les sessions sont stockées dans MySQL (table "Sessions"), pas en mémoire
const sessionStore = new SequelizeStore({ db: sequelize });

app.use(
  session({
    secret: process.env.SESSION_SECRET, // signe le cookie (voir .env)
    store: sessionStore,
    resave: false, // ne ré-enregistre pas une session inchangée
    saveUninitialized: false, // ne crée pas de session pour les visiteurs non connectés
    cookie: {
      httpOnly: true, // le JavaScript du navigateur ne peut pas lire le cookie
      sameSite: 'lax', // limite l'envoi du cookie depuis d'autres sites
      secure: false, // passer à true en production avec HTTPS
      maxAge: 1000 * 60 * 60 * 24, // le cookie dure 24 heures
    },
  })
);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 3000;

// On vérifie la connexion à la base avant de lancer le serveur
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Connexion à MySQL réussie');
    await sessionStore.sync(); // crée la table des sessions si elle n'existe pas
    app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
  } catch (error) {
    console.error('Connexion à MySQL impossible :', error.message);
  }
}

start();