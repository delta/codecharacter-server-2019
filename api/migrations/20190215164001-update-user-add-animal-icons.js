'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'users',
      'avatar', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'LION',
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'avatar');
  }
};
