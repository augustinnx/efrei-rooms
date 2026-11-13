'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // up : crée la table Campuses
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Campuses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      // Sequelize remplit ces deux colonnes tout seul
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  // down : supprime la table (pour annuler la migration)
  async down(queryInterface) {
    await queryInterface.dropTable('Campuses');
  },
};