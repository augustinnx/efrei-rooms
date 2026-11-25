'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // up : insère quelques profs (noms inventés, à remplacer par les vrais si tu veux)
  async up(queryInterface) {
    const now = new Date();
    // subjectId : 1 Algorithmique, 2 Programmation web, 3 Bases de données, 4 Mathématiques,
    // 5 Physique, 6 Réseaux, 7 Anglais, 8 Électronique, 9 Probabilités, 10 Gestion de projet
    const teachers = [
      { name: 'Mr. Dupont', email: 'dupont@efrei.net', subjectId: 1 },
      { name: 'Ms. Bernard', email: 'bernard@efrei.net', subjectId: 2 },
      { name: 'Mr. Petit', email: 'petit@efrei.net', subjectId: 3 },
      { name: 'Ms. Leroy', email: 'leroy@efrei.net', subjectId: 4 },
      { name: 'Mr. Moreau', email: 'moreau@efrei.net', subjectId: 6 },
      { name: 'Ms. Smith', email: 'smith@efrei.net', subjectId: 7 },
    ];

    await queryInterface.bulkInsert(
      'Teachers',
      teachers.map((t) => ({ ...t, createdAt: now, updatedAt: now }))
    );
  },

  // down : supprime tous les profs (pour annuler le seeder)
  async down(queryInterface) {
    await queryInterface.bulkDelete('Teachers', null, {});
  },
};