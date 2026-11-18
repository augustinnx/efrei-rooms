const { Campus, Room, Subject, Teacher } = require('../models');

// ---------- LISTE DES CAMPUS ----------
async function listCampuses(req, res) {
  try {
    // findAll = SELECT * FROM Campuses
    const campuses = await Campus.findAll({ order: [['name', 'ASC']] });
    res.json(campuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ---------- LISTE DES SALLES ----------
// On peut filtrer par campus : GET /api/rooms?campusId=1
async function listRooms(req, res) {
  try {
    const where = {};

    if (req.query.campusId) {
      const campusId = parseInt(req.query.campusId, 10);
      if (Number.isNaN(campusId)) {
        return res.status(400).json({ message: 'campusId invalide.' });
      }
      where.campusId = campusId;
    }

    const rooms = await Room.findAll({ where });

    // Tri "naturel" : A1, A2, ... A10 (et pas A1, A10, A2)
    rooms.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ---------- LISTE DES MATIÈRES ----------
async function listSubjects(req, res) {
  try {
    const subjects = await Subject.findAll({ order: [['name', 'ASC']] });
    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ---------- LISTE DES PROFS ----------
async function listTeachers(req, res) {
  try {
    const teachers = await Teacher.findAll({
      include: [{ model: Subject, attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
    });
    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { listCampuses, listRooms, listSubjects, listTeachers };