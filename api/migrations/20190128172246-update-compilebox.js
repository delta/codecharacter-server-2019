'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'compileboxes',
      'maximum_tasks',
      {
        type: DataTypes.INTEGER,
        defaultValue: 10,
      },
    )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'compileboxes',
      'maximum_tasks',
    )
  }
};
