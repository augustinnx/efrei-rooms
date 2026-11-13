const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Modèle Subject : décrit la table "Subjects" (les matières)
const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Le nom de la matière, ex : "Algorithmique"
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
});

module.exports = Subject;