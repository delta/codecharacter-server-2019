'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.removeColumn(
      'ExecuteQueues',
      'matchId'
    );

    await queryInterface.addColumn(
      'ExecuteQueues',
      'gameId',
      {
        type: Sequelize.INTEGER,
        references: {
          model: 'games',
          key: 'id',
        },
      },
    );
    return Promise.resolve(true);
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'ExecuteQueues',
      'matchId',
      {
        type: Sequelize.INTEGER,
        references: {
          model: 'matches',
          key: 'id',
        },
      },
    );

    await queryInterface.removeColumn(
      'ExecuteQueues',
      'gameId'
    );
    return Promise.resolve(true);
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
