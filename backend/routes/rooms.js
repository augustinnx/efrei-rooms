const express = require('express');
const {
  listCampuses,
  listRooms,
  listSubjects,
  listTeachers,
} = require('../controllers/roomController');

const router = express.Router();

// GET /api/rooms/campuses  -> la liste des 4 campus
router.get('/campuses', listCampuses);

// GET /api/rooms/subjects  -> la liste des matières
router.get('/subjects', listSubjects);

// GET /api/rooms/teachers  -> la liste des profs avec leur matière
router.get('/teachers', listTeachers);

// GET /api/rooms  -> la liste des salles (filtrable : /api/rooms?campusId=1)
router.get('/', listRooms);

module.exports = router;