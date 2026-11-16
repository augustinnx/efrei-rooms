const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Modèle User : décrit la table "Users" (les utilisateurs)
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  // L'email sert d'identifiant de connexion : il doit être unique
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  // On ne stocke JAMAIS le vrai mot de passe, seulement son hash bcrypt
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  // Le rôle décide des droits : étudiant par défaut
  role: {
    type: DataTypes.ENUM('student', 'admin'),
    allowNull: false,
    defaultValue: 'student',
  },
});

module.exports = User;