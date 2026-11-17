'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // up : insère les salles de chaque campus
  async up(queryInterface) {
    const now = new Date();

    // Pour modifier les salles : ajoute ou retire un nom dans la liste du campus.
    // campusId : 1 = La Maison, 2 = L'Aquarium, 3 = La Factory, 4 = New Republic
    const roomsByCampus = [
      {
        campusId: 1, // La Maison
        names: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'],
      },
      {
        campusId: 2, // L'Aquarium
        names: ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10'],
      },
      {
        campusId: 3, // La Factory
        names: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10'],
      },
      {
        campusId: 4, // New Republic
        names: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10'],
      },
    ];

    // On transforme chaque nom en une ligne de la table Rooms
    const rooms = [];
    for (const campus of roomsByCampus) {
      for (const name of campus.names) {
        rooms.push({
          name,
          capacity: 40,
          equipment: null,
          campusId: campus.campusId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await queryInterface.bulkInsert('Rooms', rooms);
  },

  // down : supprime toutes les salles (pour annuler le seeder)
  async down(queryInterface) {
    await queryInterface.bulkDelete('Rooms', null, {});
  },
};