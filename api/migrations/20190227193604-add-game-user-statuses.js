'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('games', 'status1', {
      type: Sequelize.ENUM,
      values: ['UNDEFINED', 'NORMAL', 'EXCEEDED_INSTRUCTION_LIMIT', 'RUNTIME_ERROR', 'TIMEOUT'],
      allowNull: false,
      defaultValue: 'NORMAL',
    });

    await queryInterface.addColumn('games', 'status2', {
      type: Sequelize.ENUM,
      values: ['UNDEFINED', 'NORMAL', 'EXCEEDED_INSTRUCTION_LIMIT', 'RUNTIME_ERROR', 'TIMEOUT'],
      allowNull: false,
      defaultValue: 'NORMAL',
    });

    await queryInterface.addColumn('games', 'winType', {
      type: Sequelize.ENUM,
      values: ['DEATHMATCH', 'SCORE', 'EXCEEDED_INSTRUCTION_LIMIT', 'RUNTIME_ERROR', 'TIMEOUT', 'NONE'],
      allowNull: false,
      defaultValue: 'SCORE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('games', 'winType');
    await queryInterface.removeColumn('games', 'status2');
    return queryInterface.removeColumn('games', 'status1');
  }
};
