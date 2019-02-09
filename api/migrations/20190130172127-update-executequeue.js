'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.addColumn(
      'executequeue',
      'gameId',
      {
        type: Sequelize.INTEGER,
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
