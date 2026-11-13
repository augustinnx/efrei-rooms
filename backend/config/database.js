const { Sequelize } = require('sequelize');

// Création de la connexion à MySQL avec les valeurs du fichier .env
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // mets true pour voir les requêtes SQL dans le terminal
  }
);

module.exports = sequelize;