const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Modèle BookingParticipant : décrit la table "BookingParticipants"
// C'est la table du milieu : elle dit quel étudiant a rejoint quelle réservation
const BookingParticipant = sequelize.define(
  'BookingParticipant',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Clé étrangère : la réservation rejointe
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Clé étrangère : l'étudiant qui rejoint
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // accepted = il participe, pending = en attente du créateur, refused = refusé
    status: {
      type: DataTypes.ENUM('accepted', 'pending', 'refused'),
      allowNull: false,
      defaultValue: 'accepted',
    },
  },
  {
    // Un même étudiant ne peut pas rejoindre deux fois la même réservation
    indexes: [{ unique: true, fields: ['bookingId', 'userId'] }],
  }
);

module.exports = BookingParticipant;