'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'maps',
      'isHidden', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('maps', 'isHidden');
  }
};
