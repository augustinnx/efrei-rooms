'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'premiumPlan', {
      type: Sequelize.ENUM('quarterly', 'semester'),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('Users', 'premiumUntil', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'premiumUntil');
    await queryInterface.removeColumn('Users', 'premiumPlan');
  },
};
