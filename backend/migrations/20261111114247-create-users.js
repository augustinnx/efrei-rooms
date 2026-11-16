'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // up : crée la table Users (les utilisateurs)
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      // L'email est unique : deux comptes ne peuvent pas l'avoir en commun
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      // Le hash bcrypt du mot de passe (jamais le mot de passe en clair)
      passwordHash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      // Seules ces deux valeurs sont acceptées
      role: {
        type: Sequelize.ENUM('student', 'admin'),
        allowNull: false,
        defaultValue: 'student',
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
    await queryInterface.dropTable('Users');
  },
};
