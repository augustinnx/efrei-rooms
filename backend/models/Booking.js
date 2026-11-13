const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Modèle Booking : décrit la table "Bookings" (les réservations)
const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Clé étrangère : la salle réservée
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Clé étrangère : l'étudiant qui a créé la réservation
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Clé étrangère : la matière révisée (vide pour une réservation "chill")
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Le type de réservation
  type: {
    type: DataTypes.ENUM('revision', 'chill', 'projet'),
    allowNull: false,
    defaultValue: 'revision',
  },
  // open = tout le monde peut rejoindre, closed = sur demande
  visibility: {
    type: DataTypes.ENUM('open', 'closed'),
    allowNull: false,
    defaultValue: 'open',
  },
  // Le jour de la réservation (sans l'heure)
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  // Heure de début et de fin, ex : "14:00:00"
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  // booked = réservée, confirmed = le créateur est arrivé, cancelled = annulée
  status: {
    type: DataTypes.ENUM('booked', 'confirmed', 'cancelled'),
    allowNull: false,
    defaultValue: 'booked',
  },
  // Moment où le créateur a confirmé sa présence (vide tant qu'il ne l'a pas fait)
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Petit texte libre, ex : "Je révise les graphes, venez !"
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
});

module.exports = Booking;