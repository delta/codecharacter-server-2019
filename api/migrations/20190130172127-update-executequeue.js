'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.addColumn(
      'executequeue',
      'gameId',
      {
        type: Sequelize.BIGINT,
        references: {
          model: 'games',
          key: 'id',
        },
      },
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'executequeue',
      'gameId',
    );
  }
};
