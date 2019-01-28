'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'matches',
      'verdict',
      {
        type: Sequelize.ENUM,
        values: ['0', '1', '2'],
      },
    ).then(
      queryInterface.removeColumn('matches', 'status')
    ).then(
      queryInterface.removeColumn('matches', 'match_log')
    )
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn(
      'matches',
      'verdict',
    ).then(
      queryInterface.addColumn('matches', 'status',{
        type: Sequelize.ENUM,
        values: ['Idle', 'Waiting', 'Compiling', 'Compiled', 'Error', 'Executing', 'Executed'],
        defaultValue: 'Idle',
      })
    ).then(
      queryInterface.addColumn('matches', 'match_log',{
        type: Sequelize.STRING,
        allowNull: false,
      })
    )
  }

};
