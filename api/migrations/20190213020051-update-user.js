'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'users',
      'type', {
        allowNull: false,
        type: Sequelize.ENUM,
        values: ['Student', 'Professional'],
        defaultValue: 'Professional'
      }).then(
        queryInterface.addColumn(
          'users',
          'college', {
            allowNull: true,
            type: Sequelize.STRING,
          })
      )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'type').then(queryInterface.removeColumn('users', 'college'))
  }
};
