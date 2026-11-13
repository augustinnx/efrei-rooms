'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // up : crée la table Subjects (les matières)
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Subjects', {
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
    await queryInterface.dropTable('Subjects');
  },
};