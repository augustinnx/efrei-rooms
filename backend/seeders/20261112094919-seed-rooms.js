'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // up : insère les salles de chaque campus (numéros 1 à 10)
  async up(queryInterface) {
    const now = new Date();

    // Les lettres de salles de chaque campus.
    // campusId correspond à l'ordre d'insertion du seeder des campus :
    // 1 = La Maison, 2 = L'Aquarium, 3 = La Factory, 4 = New Republic
    const lettersByCampus = [
      { campusId: 1, letters: ['A', 'B', 'C', 'D', 'E'] }, // La Maison
      { campusId: 2, letters: ['K'] }, // L'Aquarium
      { campusId: 3, letters: ['H'] }, // La Factory
      { campusId: 4, letters: ['N'] }, // New Republic
    ];


    const rooms = [];
    for (const { campusId, letters } of lettersByCampus) {
      for (const letter of letters) {
        for (let number = 1; number <= 10; number++) {
          const name = `${letter}${number}`; // ex : "A1", "A2", ... "A10"
          rooms.push({
            name,
            capacity: 40,
            equipment: null,
            campusId,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    await queryInterface.bulkInsert('Rooms', rooms);
  },

  // down : supprime toutes les salles (pour annuler le seeder)
  async down(queryInterface) {
    await queryInterface.bulkDelete('Rooms', null, {});
  },
};