const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, me, activatePremium } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Règles de validation pour l'inscription (côté SERVEUR)
const registerRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email.')
    .normalizeEmail()
    .custom((value) => value.endsWith('@efrei.net'))
    .withMessage('Use your @efrei.net address.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must contain at least 8 characters.'),
];

// Règles de validation pour la connexion
const loginRules = [
  body('email').trim().isEmail().withMessage('Invalid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

// POST /api/auth/register  -> créer un compte
router.post('/register', registerRules, register);

// POST /api/auth/login  -> se connecter
router.post('/login', loginRules, login);

// POST /api/auth/logout  -> se déconnecter
router.post('/logout', logout);

// GET /api/auth/me  -> qui est connecté ? (route PROTÉGÉE par requireAuth)
router.get('/me', requireAuth, me);

// POST /api/auth/premium -> activer l'abonnement de démonstration
router.post('/premium', requireAuth, activatePremium);

module.exports = router;
