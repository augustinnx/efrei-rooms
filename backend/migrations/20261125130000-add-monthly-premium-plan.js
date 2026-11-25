'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'premiumPlan', {
      type: Sequelize.ENUM('monthly', 'quarterly', 'semester'),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "UPDATE `Users` SET `isPremium` = false, `premiumPlan` = NULL, `premiumUntil` = NULL WHERE `premiumPlan` = 'monthly'"
    );
    await queryInterface.changeColumn('Users', 'premiumPlan', {
      type: Sequelize.ENUM('quarterly', 'semester'),
      allowNull: true,
      defaultValue: null,
    });
  },
};
