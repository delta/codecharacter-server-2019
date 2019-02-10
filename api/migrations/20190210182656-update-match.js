'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'matches',
      'status', {
        type: Sequelize.ENUM,
        values: ['QUEUED', 'EXECUTING', 'DONE'],
        allowNull: false,
        defaultValue: 'QUEUED',
      });

    await queryInterface.addColumn(
      'matches',
      'score1', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });

    await queryInterface.addColumn(
      'matches',
      'score2', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('matches', 'status');
    await queryInterface.removeColumn('matches', 'score1');
    await queryInterface.removeColumn('matches', 'score2');
  },
};
