'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // up : insère quelques matières de départ
  async up(queryInterface) {
    const now = new Date();
    const names = [
      'Algorithmique',
      'Programmation web',
      'Bases de données',
      'Mathématiques',
      'Physique',
      'Réseaux',
      'Anglais',
      'Électronique',
      'Probabilités et statistiques',
      'Gestion de projet',
    ];

    // On transforme chaque nom en une ligne { name, createdAt, updatedAt }
    await queryInterface.bulkInsert(
      'Subjects',
      names.map((name) => ({ name, createdAt: now, updatedAt: now }))
    );
  },

  // down : supprime toutes les matières (pour annuler le seeder)
  async down(queryInterface) {
    await queryInterface.bulkDelete('Subjects', null, {});
  },
};