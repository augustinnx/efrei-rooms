const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Règles de validation pour l'inscription (côté SERVEUR)
const registerRules = [
  body('firstName').trim().notEmpty().withMessage('Le prénom est obligatoire.'),
  body('lastName').trim().notEmpty().withMessage('Le nom est obligatoire.'),
  body('email').trim().isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit faire au moins 8 caractères.'),
  body('campusId').isInt({ min: 1 }).withMessage('Choisissez un campus.'),
];

// Règles de validation pour la connexion
const loginRules = [
  body('email').trim().isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est obligatoire.'),
];

// POST /api/auth/register  -> créer un compte
router.post('/register', registerRules, register);

// POST /api/auth/login  -> se connecter
router.post('/login', loginRules, login);

// POST /api/auth/logout  -> se déconnecter
router.post('/logout', logout);

// GET /api/auth/me  -> qui est connecté ? (route PROTÉGÉE par requireAuth)
router.get('/me', requireAuth, me);

module.exports = router;
