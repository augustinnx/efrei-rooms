const express = require('express');
const { body } = require('express-validator');
const {
  listBookings,
  createBooking,
  joinBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Règles de format (côté SERVEUR) pour créer une réservation
const bookingRules = [
  body('roomId').isInt({ min: 1 }).withMessage('Salle invalide.'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date invalide (AAAA-MM-JJ).'),
  body('startTime').matches(/^([01]\d|2[0-3]):00$/).withMessage('Heure de début invalide (heure pleine, ex : 09:00).'),
  body('endTime').matches(/^([01]\d|2[0-3]):00$/).withMessage('Heure de fin invalide (heure pleine, ex : 11:00).'),
  body('type').isIn(['revision', 'chill', 'projet', 'permanence']).withMessage('Type invalide.'),
  body('visibility').isIn(['open', 'closed']).withMessage('Visibilité invalide.'),
  body('maxParticipants').isInt({ min: 1, max: 40 }).withMessage('Le nombre de places doit être entre 1 et 40.'),
  body('subjectId').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Matière invalide.'),
  body('description').optional({ nullable: true }).isLength({ max: 255 }).withMessage('Description trop longue (255 max).'),
];

// GET /api/bookings  -> voir les réservations (connecté)
router.get('/', requireAuth, listBookings);

// POST /api/bookings  -> créer une réservation (connecté)
router.post('/', requireAuth, bookingRules, createBooking);

// POST /api/bookings/5/join  -> rejoindre la réservation 5
router.post('/:id/join', requireAuth, joinBooking);

// DELETE /api/bookings/5  -> supprimer la réservation 5 (créateur ou admin)
router.delete('/:id', requireAuth, deleteBooking);

module.exports = router;