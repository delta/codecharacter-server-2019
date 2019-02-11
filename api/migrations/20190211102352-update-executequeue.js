'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'executequeue',
      'type', {
        type: Sequelize.ENUM,
        values: ['USER_MATCH', 'SELF_MATCH', 'PREVIOUS_COMMIT_MATCH', 'AI_MATCH'],
        allowNull: false,
        defaultValue: 'USER_MATCH',
      });

    await queryInterface.removeColumn('executequeue', 'gameId');

    await queryInterface.addColumn('executequeue', 'gameId', {
      type: Sequelize.BIGINT,
      references: {
        model: 'games',
        key: 'id',
      },
      allowNull: true,
    });

    await queryInterface.addColumn('executequeue', 'mapId', {
      type: Sequelize.BIGINT,
      references: {
        model: 'maps',
        key: 'id',
      },
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {    
    await queryInterface.removeColumn('executequeue', 'mapId');

    await queryInterface.removeColumn('executequeue', 'gameId');

    await queryInterface.addColumn('executequeue', 'gameId', {
      type: Sequelize.BIGINT,
      references: {
        model: 'games',
        key: 'id',
      },
      allowNull: false,
    });

    await queryInterface.removeColumn('executequeue', 'type');
  }
};
