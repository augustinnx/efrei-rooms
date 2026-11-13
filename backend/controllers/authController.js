const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { User, Campus } = require('../models');

// ---------- INSCRIPTION ----------
async function register(req, res) {
  try {
    // 1. On regarde si la validation (définie dans routes/auth.js) a trouvé des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { firstName, lastName, email, password, campusId } = req.body;

    // 2. L'email est-il déjà utilisé ?
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    // 3. Le campus existe-t-il ?
    const campus = await Campus.findByPk(campusId);
    if (!campus) {
      return res.status(400).json({ message: "Ce campus n'existe pas." });
    }

    // 4. On hashe le mot de passe (10 = nombre de tours de calcul)
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. On crée l'utilisateur. Le rôle est TOUJOURS "student" ici :
    //    on ne le lit jamais dans la requête, sinon n'importe qui se ferait admin.
    const user = await User.create({
      firstName,
      lastName,
      email,
      passwordHash,
      role: 'student',
      campusId,
    });

    // 6. On le connecte directement : on stocke son id et son rôle dans la session
    req.session.userId = user.id;
    req.session.role = user.role;

    // On ne renvoie JAMAIS le hash
    res.status(201).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      campusId: user.campusId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ---------- CONNEXION ----------
async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // 1. On cherche l'utilisateur par son email
    const user = await User.findOne({ where: { email } });

    // 2. On compare le mot de passe envoyé avec le hash enregistré.
    //    Même message d'erreur si l'email OU le mot de passe est faux :
    //    on ne dit pas à un pirate quel email existe.
    const passwordOk = user && (await bcrypt.compare(password, user.passwordHash));
    if (!passwordOk) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // 3. Tout est bon : on ouvre la session
    req.session.userId = user.id;
    req.session.role = user.role;

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      campusId: user.campusId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ---------- DÉCONNEXION ----------
function logout(req, res) {
  // On détruit la session côté serveur et on efface le cookie
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Déconnecté.' });
  });
}

// ---------- QUI SUIS-JE ? ----------
// Sert à Vue pour savoir si quelqu'un est déjà connecté (au rechargement de la page)
async function me(req, res) {
  try {
    const user = await User.findByPk(req.session.userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'campusId'], // pas de passwordHash
    });
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { register, login, logout, me };
