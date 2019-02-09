'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'compilequeue',
      'status', {
        type: Sequelize.ENUM,
        allowNull: false,
        values: ['QUEUED', 'COMPILING', 'DONE'],
        defaultValue: 'QUEUED',
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'compilequeue',
      'status',
    );
  }
};
