'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // up : crée la table BookingParticipants (la table du milieu)
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookingParticipants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // Clé étrangère : la réservation rejointe
      bookingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Bookings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Clé étrangère : l'étudiant qui rejoint
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('accepted', 'pending', 'refused'),
        allowNull: false,
        defaultValue: 'accepted',
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

    // Un étudiant ne peut pas rejoindre deux fois la même réservation
    await queryInterface.addIndex('BookingParticipants', ['bookingId', 'userId'], {
      unique: true,
      name: 'unique_booking_user',
    });
  },

  // down : supprime la table (pour annuler la migration)
  async down(queryInterface) {
    await queryInterface.dropTable('BookingParticipants');
  },
};