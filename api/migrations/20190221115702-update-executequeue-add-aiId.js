'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'executequeue',
      'aiId', {
        type: Sequelize.BIGINT,
        references: {
          model: 'ais',
          key: 'id',
        },
        allowNull: true,
        defaultValue: null,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('executequeue', 'aiId');
  }
};
