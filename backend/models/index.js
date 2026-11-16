const sequelize = require('../config/database');
const Campus = require('./Campus');
const Subject = require('./Subject');
const Room = require('./Room');
const Teacher = require('./Teacher');
const User = require('./User');
const Booking = require('./Booking');
const BookingParticipant = require('./BookingParticipant');

// ---------- Relations "un à plusieurs" ----------

// Un campus a plusieurs salles, une salle appartient à un campus
Campus.hasMany(Room, { foreignKey: 'campusId' });
Room.belongsTo(Campus, { foreignKey: 'campusId' });

// Une matière a plusieurs profs, un prof enseigne une matière
Subject.hasMany(Teacher, { foreignKey: 'subjectId' });
Teacher.belongsTo(Subject, { foreignKey: 'subjectId' });

// Une salle a plusieurs réservations, une réservation concerne une salle
Room.hasMany(Booking, { foreignKey: 'roomId' });
Booking.belongsTo(Room, { foreignKey: 'roomId' });

// Une matière a plusieurs réservations, une réservation concerne une matière
Subject.hasMany(Booking, { foreignKey: 'subjectId' });
Booking.belongsTo(Subject, { foreignKey: 'subjectId' });

// Un utilisateur crée plusieurs réservations (alias "creator" pour le distinguer des participants)
User.hasMany(Booking, { foreignKey: 'creatorId', as: 'createdBookings' });
Booking.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// ---------- Relation "plusieurs à plusieurs" ----------

// Un utilisateur rejoint plusieurs réservations, une réservation a plusieurs participants
// La table du milieu est BookingParticipants
Booking.belongsToMany(User, {
  through: BookingParticipant,
  foreignKey: 'bookingId',
  otherKey: 'userId',
  as: 'participants',
});
User.belongsToMany(Booking, {
  through: BookingParticipant,
  foreignKey: 'userId',
  otherKey: 'bookingId',
  as: 'joinedBookings',
});

// Accès direct à la table du milieu (pour lire le statut : accepted, pending...)
Booking.hasMany(BookingParticipant, { foreignKey: 'bookingId' });
BookingParticipant.belongsTo(Booking, { foreignKey: 'bookingId' });
User.hasMany(BookingParticipant, { foreignKey: 'userId' });
BookingParticipant.belongsTo(User, { foreignKey: 'userId' });

// On exporte tout depuis un seul endroit
module.exports = {
  sequelize,
  Campus,
  Subject,
  Room,
  Teacher,
  User,
  Booking,
  BookingParticipant,
};