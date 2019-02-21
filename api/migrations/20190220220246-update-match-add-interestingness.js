'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'matches',
      'interestingness', {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('matches', 'interestingness');
  }
};
