'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'users',
      'isPragyan', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'isPragyan');
  }
};
