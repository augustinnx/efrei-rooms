const express = require('express');
const { listCampuses, listRooms } = require('../controllers/roomController');

const router = express.Router();

// GET /api/rooms/campuses  -> la liste des 4 campus
router.get('/campuses', listCampuses);

// GET /api/rooms  -> la liste des salles (filtrable : /api/rooms?campusId=1)
router.get('/', listRooms);

module.exports = router;