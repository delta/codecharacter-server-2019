'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'activated');
    return queryInterface.addColumn(
      'users',
      'activated', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'activated');
    return queryInterface.addColumn(
      'users',
      'activated', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
    );

  }
};
