'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // up : insère les 4 campus de l'EFREI
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('Campuses', [
      { name: 'The House', createdAt: now, updatedAt: now },
      { name: 'The Aquarium', createdAt: now, updatedAt: now },
      { name: 'The Factory', createdAt: now, updatedAt: now },
      { name: 'New Republic', createdAt: now, updatedAt: now },
    ]);
  },

  // down : supprime tous les campus (pour annuler le seeder)
  async down(queryInterface) {
    await queryInterface.bulkDelete('Campuses', null, {});
  },
};
