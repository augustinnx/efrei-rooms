const express = require('express');
const { listCampuses, listRooms, listSubjects } = require('../controllers/roomController');
const router = express.Router();

// GET /api/rooms/campuses  -> la liste des 4 campus
router.get('/campuses', listCampuses);

// GET /api/rooms  -> la liste des salles (filtrable : /api/rooms?campusId=1)
router.get('/', listRooms);

// GET /api/rooms/subjects  -> la liste des matières
router.get('/subjects', listSubjects);
module.exports = router;