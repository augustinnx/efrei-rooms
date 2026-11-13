const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Modèle Teacher : décrit la table "Teachers" (les profs)
const Teacher = sequelize.define('Teacher', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Le nom du prof, ex : "M. Dupont"
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  // L'email du prof, utilisé pour le bouton "Contacter" (lien mailto:)
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { isEmail: true }, // refuse un email mal écrit
  },
  // Clé étrangère : la matière enseignée par ce prof
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Teacher;