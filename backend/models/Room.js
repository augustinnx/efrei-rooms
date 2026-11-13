const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Modèle Room : décrit la table "Rooms" (les salles)
const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Le nom de la salle, ex : "B204"
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  // Le nombre de places, 40 par défaut
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 40,
    validate: { min: 1, max: 40 }, // refuse une capacité hors de 1 à 40
  },
  // Les équipements (projecteur, prises...), facultatif
  equipment: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // true si c'est une salle de permanence (pour le tableau de bord)
  isPermanence: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  // Clé étrangère : le campus auquel appartient la salle
  campusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Room;