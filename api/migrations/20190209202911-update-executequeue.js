'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'executequeue',
      'status', {
        type: Sequelize.ENUM,
        allowNull: false,
        values: ['QUEUED', 'EXECUTING', 'DONE'],
        defaultValue: 'QUEUED',
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'executequeue',
      'status',
    );
  }
};
