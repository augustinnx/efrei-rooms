const express = require('express');
const { body } = require('express-validator');
const {
  listBookings,
  createBooking,
  joinBooking,
  deleteBooking,
  updateBooking,
  listMyBookings,
  listUpcoming,
  topSubjects,
} = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Règles de format (côté SERVEUR) pour créer une réservation
const bookingRules = [
  body('roomId').isInt({ min: 1 }).withMessage('Invalid room.'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid date (YYYY-MM-DD).'),
  body('startTime').matches(/^([01]\d|2[0-3]):00$/).withMessage('Invalid start time (full hour, e.g. 09:00).'),
  body('endTime').matches(/^([01]\d|2[0-3]):00$/).withMessage('Invalid end time (full hour, e.g. 11:00).'),
  body('type').isIn(['revision', 'chill', 'projet', 'permanence']).withMessage('Invalid type.'),
  body('visibility').equals('open').withMessage('Groups are open to everyone.'),
  body('maxParticipants').isInt({ min: 1, max: 40 }).withMessage('The number of spots must be between 1 and 40.'),
  body('subjectId').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Invalid subject.'),
  body('description').optional({ nullable: true }).isLength({ max: 255 }).withMessage('Description is too long (255 characters maximum).'),
];

// GET /api/bookings  -> voir les réservations d'un jour (connecté)
router.get('/', requireAuth, listBookings);

// GET /api/bookings/mine  -> mes réservations (créées et rejointes)
router.get('/mine', requireAuth, listMyBookings);

// GET /api/bookings/upcoming  -> ce qui se passe cette semaine (page d'accueil)
router.get('/upcoming', requireAuth, listUpcoming);

// GET /api/bookings/stats/subjects  -> les matières les plus réservées
router.get('/stats/subjects', requireAuth, topSubjects);

// POST /api/bookings  -> créer une réservation (connecté)
router.post('/', requireAuth, bookingRules, createBooking);

// POST /api/bookings/5/join  -> rejoindre la réservation 5
router.post('/:id/join', requireAuth, joinBooking);

// PUT /api/bookings/5  -> modifier la réservation 5 (créateur ou admin)
router.put('/:id', requireAuth, updateBooking);

// DELETE /api/bookings/5  -> supprimer la réservation 5 (créateur ou admin)
router.delete('/:id', requireAuth, deleteBooking);

module.exports = router;