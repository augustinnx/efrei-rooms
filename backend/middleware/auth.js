// Gardien 1 : l'utilisateur doit être connecté
function requireAuth(req, res, next) {
  // req.session.userId est rempli au moment de la connexion
  if (!req.session.userId) {
    return res.status(401).json({ message: 'You must be logged in.' });
  }
  next(); // tout va bien, on passe à la route suivante
}

// Gardien 2 : l'utilisateur doit être admin
function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'You must be logged in.' });
  }
  if (req.session.role !== 'admin') {
    return res.status(403).json({ message: 'Access restricted to administrators.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };