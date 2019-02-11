'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'compilequeue',
      'commitHash', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'latest',
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('compilequeue', 'commitHash');
  }
};
