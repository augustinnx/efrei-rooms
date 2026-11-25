const { Op, QueryTypes } = require('sequelize');
const { validationResult } = require('express-validator');
const { sequelize, Booking, BookingParticipant, Campus, Room, Subject, User } = require('../models');// Transforme une date JavaScript en texte "AAAA-MM-JJ"
function toDateString(d) {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function isValidDateString(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && toDateString(parsed) === date;
}

function isPremiumActive(user) {
  return user.isPremium && (!user.premiumUntil || user.premiumUntil >= toDateString(new Date()));
}

function currentWeekRange() {
  const now = new Date();
  const daysSinceMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  return {
    start: toDateString(monday),
    nextStart: toDateString(nextMonday),
  };
}

// ---------- LISTE DES RÉSERVATIONS ----------
// GET /api/bookings?campusId=1&date=2026-11-17
async function listBookings(req, res) {
  try {
    const { campusId, date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date (YYYY-MM-DD format).' });
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
    res.status(500).json({ message: 'Server error.' });
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
      return res.status(400).json({ message: 'End time must be after start time.' });
    }
    if (start < 8 || end > 20) {
      return res.status(400).json({ message: 'Rooms are open from 8 AM to 8 PM.' });
    }

    // 3. Règles sur le jour : pas de week-end
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay(); // 0 = dimanche, 6 = samedi
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ message: 'Bookings are available Monday through Friday.' });
    }

    // 4. Pas dans le passé, et 7 jours maximum à l'avance
    const now = new Date();
    const todayString = toDateString(now);
    if (date < todayString) {
      return res.status(400).json({ message: 'Cannot book in the past.' });
    }
    if (date === todayString && start <= now.getHours()) {
      return res.status(400).json({ message: 'This time slot has already started.' });
    }
    const limit = new Date();
    limit.setDate(limit.getDate() + 7);
    if (date > toDateString(limit)) {
      return res.status(400).json({ message: 'Bookings can be made up to 7 days in advance.' });
    }

    // 5. Seul un admin peut créer une permanence
    if (type === 'permanence' && req.session.role !== 'admin') {
      return res.status(403).json({ message: 'Only an administrator can create office hours.' });
    }

    // 6. La salle existe-t-elle ?
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(400).json({ message: 'This room does not exist.' });
    }

    // 7. Une révision doit avoir une matière, et la matière doit exister
    if (type === 'revision' && !subjectId) {
      return res.status(400).json({ message: 'Choose a subject for study.' });
    }
    if (subjectId) {
      const subject = await Subject.findByPk(subjectId);
      if (!subject) {
        return res.status(400).json({ message: 'This subject does not exist.' });
      }
    }

    // Verrouiller le compte rend le contrôle de quota atomique pour deux demandes simultanées.
    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(req.session.userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user) {
        return { status: 401, message: 'User not found.' };
      }

      const { start: weekStart, nextStart: nextWeekStart } = currentWeekRange();
      const weeklyBookings = await Booking.count({
        where: {
          creatorId: user.id,
          createdAt: {
            [Op.gte]: new Date(`${weekStart}T00:00:00`),
            [Op.lt]: new Date(`${nextWeekStart}T00:00:00`),
          },
        },
        transaction,
      });
      if (!isPremiumActive(user) && weeklyBookings >= 1) {
        return {
          status: 403,
          message: 'Your free weekly room booking has already been used. Upgrade to Pro to book without limits.',
        };
      }

      const conflict = await Booking.findOne({
        where: {
          roomId,
          date,
          status: { [Op.ne]: 'cancelled' },
          startTime: { [Op.lt]: `${endTime}:00` },
          endTime: { [Op.gt]: `${startTime}:00` },
        },
        transaction,
      });
      if (conflict) {
        return { status: 409, message: 'This room is already booked for this time slot.' };
      }

      const booking = await Booking.create({
        roomId,
        creatorId: user.id,
        subjectId: subjectId || null,
        type,
        visibility: 'open',
        maxParticipants: Math.min(maxParticipants, room.capacity),
        date,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        description: description || null,
      }, { transaction });
      return { booking };
    });

    if (result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(201).json(result.booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ---------- REJOINDRE UNE RÉSERVATION ----------
// POST /api/bookings/:id/join
async function joinBooking(req, res) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (Number.isNaN(bookingId)) {
      return res.status(400).json({ message: 'Invalid identifier.' });
    }

    // 1. La réservation existe-t-elle ?
    const booking = await Booking.findByPk(bookingId);
    if (!booking || booking.status === 'cancelled') {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // 2. Le créateur est déjà dedans d'office
    if (booking.creatorId === req.session.userId) {
      return res.status(400).json({ message: 'You created this booking.' });
    }

    // 3. La réservation est-elle déjà terminée ?
    const now = new Date();
    const endHour = parseInt(booking.endTime.slice(0, 2), 10);
    if (booking.date < toDateString(now) || (booking.date === toDateString(now) && endHour <= now.getHours())) {
      return res.status(400).json({ message: 'This booking has ended.' });
    }

    // 4. A-t-on déjà rejoint ?
    const already = await BookingParticipant.findOne({
      where: { bookingId, userId: req.session.userId },
    });
    if (already) {
      return res.status(409).json({ message: 'You have already requested to join this booking.' });
    }

    // 5. Reste-t-il de la place ? (participants acceptés + le créateur)
    const taken = (await BookingParticipant.count({ where: { bookingId, status: 'accepted' } })) + 1;
    if (taken >= booking.maxParticipants) {
      return res.status(409).json({ message: 'This booking is full.' });
    }

    const participant = await BookingParticipant.create({
      bookingId,
      userId: req.session.userId,
      status: 'accepted',
    });

    res.status(201).json(participant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ---------- QUITTER UN GROUPE REJOINT ----------
// DELETE /api/bookings/:id/leave
async function leaveBooking(req, res) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (Number.isNaN(bookingId)) {
      return res.status(400).json({ message: 'Invalid identifier.' });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking || booking.status === 'cancelled') {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    if (booking.creatorId === req.session.userId) {
      return res.status(400).json({ message: 'As the creator, you cannot leave your own booking.' });
    }

    const participant = await BookingParticipant.findOne({
      where: { bookingId, userId: req.session.userId },
    });
    if (!participant) {
      return res.status(404).json({ message: 'You have not joined this group.' });
    }

    await participant.destroy();
    res.json({ message: 'You left the group.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ---------- SUPPRIMER UNE RÉSERVATION ----------
// DELETE /api/bookings/:id
async function deleteBooking(req, res) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (Number.isNaN(bookingId)) {
      return res.status(400).json({ message: 'Invalid identifier.' });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // AUTORISATION : seul le créateur ou un admin peut supprimer
    if (booking.creatorId !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own bookings.' });
    }

    // Garder la réservation annulée pour qu'elle reste comptabilisée dans le quota hebdomadaire.
    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ---------- MODIFIER UNE RÉSERVATION ----------
// PUT /api/bookings/:id
// On peut changer : description, visibilité, nombre de places, matière.
// (Pour changer la salle ou l'heure, on supprime et on recrée : ça évite de refaire la détection de conflit.)
async function updateBooking(req, res) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (Number.isNaN(bookingId)) {
      return res.status(400).json({ message: 'Invalid identifier.' });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking || booking.status === 'cancelled') {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // AUTORISATION : seul le créateur ou un admin peut modifier
    if (booking.creatorId !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ message: 'You can only edit your own bookings.' });
    }

    const { description, visibility, maxParticipants, subjectId, date, startTime, endTime } = req.body || {};

    if (date !== undefined || startTime !== undefined || endTime !== undefined) {
      const nextDate = date === undefined ? booking.date : date;
      const nextStartTime = startTime === undefined ? booking.startTime.slice(0, 5) : startTime;
      const nextEndTime = endTime === undefined ? booking.endTime.slice(0, 5) : endTime;

      if (!isValidDateString(nextDate)) {
        return res.status(400).json({ message: 'Invalid date (YYYY-MM-DD format).' });
      }
      if (
        typeof nextStartTime !== 'string' ||
        !/^([01]\d|2[0-3]):00$/.test(nextStartTime) ||
        typeof nextEndTime !== 'string' ||
        !/^([01]\d|2[0-3]):00$/.test(nextEndTime)
      ) {
        return res.status(400).json({ message: 'Invalid time (use full hours, e.g. 09:00).' });
      }

      const start = parseInt(nextStartTime.slice(0, 2), 10);
      const end = parseInt(nextEndTime.slice(0, 2), 10);
      if (start >= end) {
        return res.status(400).json({ message: 'End time must be after start time.' });
      }
      if (start < 8 || end > 20) {
        return res.status(400).json({ message: 'Rooms are open from 8 AM to 8 PM.' });
      }

      const dayOfWeek = new Date(`${nextDate}T12:00:00`).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return res.status(400).json({ message: 'Bookings are available Monday through Friday.' });
      }

      const now = new Date();
      const today = toDateString(now);
      if (nextDate < today) {
        return res.status(400).json({ message: 'Cannot book in the past.' });
      }
      if (nextDate === today && start <= now.getHours()) {
        return res.status(400).json({ message: 'This time slot has already started.' });
      }
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() + 7);
      if (nextDate > toDateString(dateLimit)) {
        return res.status(400).json({ message: 'Bookings can be made up to 7 days in advance.' });
      }

      const conflict = await Booking.findOne({
        where: {
          id: { [Op.ne]: bookingId },
          roomId: booking.roomId,
          date: nextDate,
          status: { [Op.ne]: 'cancelled' },
          startTime: { [Op.lt]: `${nextEndTime}:00` },
          endTime: { [Op.gt]: `${nextStartTime}:00` },
        },
      });
      if (conflict) {
        return res.status(409).json({ message: 'This room is already booked for this time slot.' });
      }

      booking.date = nextDate;
      booking.startTime = `${nextStartTime}:00`;
      booking.endTime = `${nextEndTime}:00`;
    }

    // Visibilité
    if (visibility !== undefined) {
      if (visibility !== 'open') {
        return res.status(400).json({ message: 'Invalid visibility.' });
      }
      booking.visibility = visibility;
    }

    // Nombre de places : entre 1 et 40, et pas moins que les participants déjà acceptés
    if (maxParticipants !== undefined) {
      const max = parseInt(maxParticipants, 10);
      if (Number.isNaN(max) || max < 1 || max > 40) {
        return res.status(400).json({ message: 'The number of spots must be between 1 and 40.' });
      }
      const taken = (await BookingParticipant.count({ where: { bookingId, status: 'accepted' } })) + 1;
      if (max < taken) {
        return res.status(409).json({ message: `There are already ${taken} participants; you cannot go below that number.` });
      }
      booking.maxParticipants = max;
    }

    // Matière : obligatoire pour une révision, et elle doit exister
    if (subjectId !== undefined) {
      if (subjectId === null) {
        if (booking.type === 'revision') {
          return res.status(400).json({ message: 'A study session must have a subject.' });
        }
        booking.subjectId = null;
      } else {
        const subject = await Subject.findByPk(subjectId);
        if (!subject) {
          return res.status(400).json({ message: 'This subject does not exist.' });
        }
        booking.subjectId = subject.id;
      }
    }

    // Description
    if (description !== undefined) {
      if (description && description.length > 255) {
        return res.status(400).json({ message: 'Description is too long (255 characters maximum).' });
      }
      booking.description = description || null;
    }

    await booking.save(); // UPDATE dans MySQL
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ---------- MES RÉSERVATIONS ----------
// GET /api/bookings/mine : celles que j'ai créées + celles que j'ai rejointes (à venir)
async function listMyBookings(req, res) {
  try {
    const today = toDateString(new Date());
    const { start: weekStart, nextStart: nextWeekStart } = currentWeekRange();
    const [user, weeklyBookings] = await Promise.all([
      User.findByPk(req.session.userId, { attributes: ['isPremium', 'premiumPlan', 'premiumUntil'] }),
      Booking.count({
        where: {
          creatorId: req.session.userId,
          createdAt: {
            [Op.gte]: new Date(`${weekStart}T00:00:00`),
            [Op.lt]: new Date(`${nextWeekStart}T00:00:00`),
          },
        },
      }),
    ]);
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    // 1. Les réservations que j'ai créées
    const created = await Booking.findAll({
      where: {
        creatorId: req.session.userId,
        status: { [Op.ne]: 'cancelled' },
        date: { [Op.gte]: today }, // seulement aujourd'hui et après
      },
      include: [
        { model: Room, attributes: ['id', 'name'] },
        { model: Subject, attributes: ['id', 'name'] },
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    // 2. Celles que j'ai rejointes (avec mon statut : accepté ou en attente)
    const participations = await BookingParticipant.findAll({
      where: { userId: req.session.userId },
      include: [
        {
          model: Booking,
          where: { status: { [Op.ne]: 'cancelled' }, date: { [Op.gte]: today } },
          include: [
            { model: Room, attributes: ['id', 'name'] },
            { model: Subject, attributes: ['id', 'name'] },
          ],
        },
      ],
    });

    const joined = participations
      .map((p) => ({ ...p.Booking.toJSON(), myStatus: p.status }))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

    const premiumActive = isPremiumActive(user);
    res.json({
      created,
      joined,
      reservationQuota: {
        isPremium: premiumActive,
        plan: premiumActive ? user.premiumPlan : null,
        premiumUntil: premiumActive ? user.premiumUntil : null,
        used: weeklyBookings,
        limit: premiumActive ? null : 1,
        remaining: premiumActive ? null : Math.max(0, 1 - weeklyBookings),
        weekStartsAt: weekStart,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ---------- RÉSERVATIONS À VENIR (page d'accueil) ----------
// GET /api/bookings/upcoming : tout ce qui se passe dans les 7 prochains jours
async function listUpcoming(req, res) {
  try {
    const now = new Date();
    const today = toDateString(now);
    const limit = new Date();
    limit.setDate(limit.getDate() + 7);

    const bookings = await Booking.findAll({
      where: {
        status: { [Op.ne]: 'cancelled' },
        date: { [Op.between]: [today, toDateString(limit)] },
      },
      include: [
        {
          model: Room,
          attributes: ['id', 'name', 'campusId'],
          include: [{ model: Campus, attributes: ['id', 'name'] }],
        },
        { model: Subject, attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        { model: BookingParticipant, attributes: ['userId', 'status'] },
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    const me = req.session.userId;

    const data = bookings
      // on retire les créneaux d'aujourd'hui déjà terminés
      .filter((b) => b.date !== today || parseInt(b.endTime.slice(0, 2), 10) > now.getHours())
      .map((b) => {
        const json = b.toJSON();
        const accepted = json.BookingParticipants.filter((p) => p.status === 'accepted').length;
        const mine = json.BookingParticipants.find((p) => p.userId === me);
        delete json.BookingParticipants; // on ne renvoie pas la liste des participants
        return {
          ...json,
          taken: accepted + 1, // participants acceptés + le créateur
          isMine: json.creatorId === me,
          myStatus: mine ? mine.status : null,
        };
      });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ---------- MATIÈRES LES PLUS RÉSERVÉES ----------
// GET /api/bookings/stats/subjects : requête SQL écrite à la main avec GROUP BY
async function topSubjects(req, res) {
  try {
    const rows = await sequelize.query(
      `SELECT s.id, s.name, COUNT(b.id) AS total
         FROM Bookings b
         JOIN Subjects s ON s.id = b.subjectId
        WHERE b.status <> 'cancelled'
        GROUP BY s.id, s.name
        ORDER BY total DESC
        LIMIT 5`,
      { type: QueryTypes.SELECT }
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = {
  listBookings,
  createBooking,
  joinBooking,
  leaveBooking,
  deleteBooking,
  updateBooking,
  listMyBookings,
  listUpcoming,
  topSubjects,
};