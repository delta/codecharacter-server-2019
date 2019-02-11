'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'executequeue',
      'isSelf', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });

    await queryInterface.removeColumn('executequeue', 'gameId');

    await queryInterface.addColumn('executequeue', 'gameId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'games',
        key: 'id',
      },
      allowNull: true,
    });

    await queryInterface.addColumn('executequeue', 'mapId', {
      type: Sequelize.INTEGER,
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
      type: Sequelize.INTEGER,
      references: {
        model: 'games',
        key: 'id',
      },
      allowNull: false,
    });

    await queryInterface.removeColumn('executequeue', 'isSelf');
  }
};
