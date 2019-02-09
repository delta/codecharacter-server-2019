'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'games',
      'mapId', {
        type: Sequelize.INTEGER,
        references: {
          model: 'maps',
          key: 'id',
        },
      },
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'games',
      'mapId',
    );
  }
};
