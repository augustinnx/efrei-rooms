'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // up : insère quelques profs (noms inventés, à remplacer par les vrais si tu veux)
  async up(queryInterface) {
    const now = new Date();
    // subjectId : 1 Algorithmique, 2 Programmation web, 3 Bases de données, 4 Mathématiques,
    // 5 Physique, 6 Réseaux, 7 Anglais, 8 Électronique, 9 Probabilités, 10 Gestion de projet
    const teachers = [
      { name: 'M. Dupont', email: 'dupont@efrei.net', subjectId: 1 },
      { name: 'Mme Bernard', email: 'bernard@efrei.net', subjectId: 2 },
      { name: 'M. Petit', email: 'petit@efrei.net', subjectId: 3 },
      { name: 'Mme Leroy', email: 'leroy@efrei.net', subjectId: 4 },
      { name: 'M. Moreau', email: 'moreau@efrei.net', subjectId: 6 },
      { name: 'Mme Smith', email: 'smith@efrei.net', subjectId: 7 },
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