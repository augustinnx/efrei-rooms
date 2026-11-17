const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { Booking, BookingParticipant, Room, Subject, User } = require('../models');

// Transforme une date JavaScript en texte "AAAA-MM-JJ"
function toDateString(d) {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// ---------- LISTE DES RÉSERVATIONS ----------
// GET /api/bookings?campusId=1&date=2026-11-17
async function listBookings(req, res) {
  try {
    const { campusId, date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Date invalide (format AAAA-MM-JJ).' });
    }

    const roomFilter = {};
    if (campusId) {
      roomFilter.campusId = parseInt(campusId, 10);
    }

    const bookings = await Booking.findAll({
      where: {
        date,
        status: { [Op.ne]: 'cancelled' }, // on cache les réservations annulées
      },
      include: [
        { model: Room, attributes: ['id', 'name', 'campusId'], where: roomFilter },
        { model: Subject, attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['startTime', 'ASC']],
    });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ---------- CRÉER UNE RÉSERVATION ----------
// POST /api/bookings
async function createBooking(req, res) {
  try {
    // 1. Le format des champs a-t-il été validé dans routes/bookings.js ?
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { roomId, date, startTime, endTime, type, visibility, maxParticipants, subjectId, description } =
      req.body;

    // Les heures arrivent sous la forme "09:00" : on garde juste le nombre (9)
    const start = parseInt(startTime.slice(0, 2), 10);
    const end = parseInt(endTime.slice(0, 2), 10);

    // 2. Règles sur les heures
    if (start >= end) {
      return res.status(400).json({ message: "L'heure de fin doit être après l'heure de début." });
    }
    if (start < 8 || end > 20) {
      return res.status(400).json({ message: 'Les salles sont ouvertes de 8h à 20h.' });
    }

    // 3. Règles sur le jour : pas de week-end
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay(); // 0 = dimanche, 6 = samedi
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ message: 'Les réservations sont possibles du lundi au vendredi.' });
    }

    // 4. Pas dans le passé, et 7 jours maximum à l'avance
    const now = new Date();
    const todayString = toDateString(now);
    if (date < todayString) {
      return res.status(400).json({ message: 'Impossible de réserver dans le passé.' });
    }
    if (date === todayString && start <= now.getHours()) {
      return res.status(400).json({ message: 'Ce créneau a déjà commencé.' });
    }
    const limit = new Date();
    limit.setDate(limit.getDate() + 7);
    if (date > toDateString(limit)) {
      return res.status(400).json({ message: 'Réservation possible 7 jours à l’avance maximum.' });
    }

    // 5. Seul un admin peut créer une permanence
    if (type === 'permanence' && req.session.role !== 'admin') {
      return res.status(403).json({ message: 'Seul un administrateur peut créer une permanence.' });
    }

    // 6. La salle existe-t-elle ?
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(400).json({ message: "Cette salle n'existe pas." });
    }

    // 7. Une révision doit avoir une matière, et la matière doit exister
    if (type === 'revision' && !subjectId) {
      return res.status(400).json({ message: 'Choisissez une matière pour une révision.' });
    }
    if (subjectId) {
      const subject = await Subject.findByPk(subjectId);
      if (!subject) {
        return res.status(400).json({ message: "Cette matière n'existe pas." });
      }
    }

    // 8. DÉTECTION DE CONFLIT : y a-t-il déjà une réservation qui chevauche ?
    const conflict = await Booking.findOne({
      where: {
        roomId,
        date,
        status: { [Op.ne]: 'cancelled' },
        startTime: { [Op.lt]: `${endTime}:00` }, // elle commence avant ma fin...
        endTime: { [Op.gt]: `${startTime}:00` }, // ...et finit après mon début
      },
    });
    if (conflict) {
      return res.status(409).json({ message: 'Cette salle est déjà réservée sur ce créneau.' });
    }

    // 9. Tout est bon : on crée la réservation
    const booking = await Booking.create({
      roomId,
      creatorId: req.session.userId, // le créateur est l'utilisateur connecté
      subjectId: subjectId || null,
      type,
      visibility,
      maxParticipants: Math.min(maxParticipants, room.capacity), // jamais plus que la salle
      date,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      description: description || null,
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ---------- REJOINDRE UNE RÉSERVATION ----------
// POST /api/bookings/:id/join
async function joinBooking(req, res) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (Number.isNaN(bookingId)) {
      return res.status(400).json({ message: 'Identifiant invalide.' });
    }

    // 1. La réservation existe-t-elle ?
    const booking = await Booking.findByPk(bookingId);
    if (!booking || booking.status === 'cancelled') {
      return res.status(404).json({ message: 'Réservation introuvable.' });
    }

    // 2. Le créateur est déjà dedans d'office
    if (booking.creatorId === req.session.userId) {
      return res.status(400).json({ message: 'Vous êtes le créateur de cette réservation.' });
    }

    // 3. La réservation est-elle déjà terminée ?
    const now = new Date();
    const endHour = parseInt(booking.endTime.slice(0, 2), 10);
    if (booking.date < toDateString(now) || (booking.date === toDateString(now) && endHour <= now.getHours())) {
      return res.status(400).json({ message: 'Cette réservation est terminée.' });
    }

    // 4. A-t-on déjà rejoint ?
    const already = await BookingParticipant.findOne({
      where: { bookingId, userId: req.session.userId },
    });
    if (already) {
      return res.status(409).json({ message: 'Vous avez déjà demandé à rejoindre cette réservation.' });
    }

    // 5. Reste-t-il de la place ? (participants acceptés + le créateur)
    const taken = (await BookingParticipant.count({ where: { bookingId, status: 'accepted' } })) + 1;
    if (taken >= booking.maxParticipants) {
      return res.status(409).json({ message: 'Cette réservation est complète.' });
    }

    // 6. Groupe ouvert : accepté tout de suite. Groupe fermé : en attente du créateur.
    const status = booking.visibility === 'open' ? 'accepted' : 'pending';
    const participant = await BookingParticipant.create({
      bookingId,
      userId: req.session.userId,
      status,
    });

    res.status(201).json(participant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ---------- SUPPRIMER UNE RÉSERVATION ----------
// DELETE /api/bookings/:id
async function deleteBooking(req, res) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (Number.isNaN(bookingId)) {
      return res.status(400).json({ message: 'Identifiant invalide.' });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable.' });
    }

    // AUTORISATION : seul le créateur ou un admin peut supprimer
    if (booking.creatorId !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ message: "Vous ne pouvez supprimer que vos propres réservations." });
    }

    // Les participants sont supprimés automatiquement (ON DELETE CASCADE)
    await booking.destroy();

    res.json({ message: 'Réservation supprimée.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { listBookings, createBooking, joinBooking, deleteBooking };