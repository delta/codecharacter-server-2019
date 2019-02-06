'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'games',
      'mapId',
      {
        type: Sequelize.INTEGER,
      },
    );

    await queryInterface.addColumn(
      'games',
      'createdAt',
      {
        type: Sequelize.INTEGER,
      },
    );

    return queryInterface.addColumn(
      'games',
      'updatedAt',
      {
        type: Sequelize.INTEGER,
      },
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('games','mapId');
    await queryInterface.removeColumn('games','createdAt');
    return queryInterface.removeColumn('games','updatedAt');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
