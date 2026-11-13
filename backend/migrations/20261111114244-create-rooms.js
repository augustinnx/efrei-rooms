'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // up : crée la table Rooms (les salles)
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Rooms', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 40,
      },
      equipment: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      isPermanence: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Clé étrangère : pointe vers l'id d'un campus
      campusId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Campuses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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
    await queryInterface.dropTable('Rooms');
  },
};
