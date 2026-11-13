const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Modèle Campus : décrit la table "Campuses"
const Campus = sequelize.define('Campus', {
  // L'identifiant unique, généré automatiquement (1, 2, 3...)
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Le nom du campus, obligatoire et unique
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
});

module.exports = Campus;