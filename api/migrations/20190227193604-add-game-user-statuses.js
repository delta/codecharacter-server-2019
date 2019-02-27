'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    await queryInterface.addColumn('matches', 'status1', {
      type: Sequelize.ENUM,
      values: ['UNDEFINED', 'NORMAL', 'EXCEEDED_INSTRUCTION_LIMIT', 'RUNTIME_ERROR', 'TIMEOUT'],
      allowNull: false,
      defaultValue: 'NORMAL',
    });

    await queryInterface.addColumn('matches', 'status2', {
      type: Sequelize.ENUM,
      values: ['UNDEFINED', 'NORMAL', 'EXCEEDED_INSTRUCTION_LIMIT', 'RUNTIME_ERROR', 'TIMEOUT'],
      allowNull: false,
      defaultValue: 'NORMAL',
    });

    await queryInterface.addColumn('matches', 'winType', {
      type: Sequelize.ENUM,
      values: ['DEATHMATCH', 'SCORE', 'EXCEEDED_INSTRUCTION_LIMIT', 'RUNTIME_ERROR', 'TIMEOUT', 'NONE'],
      allowNull: false,
      defaultValue: 'SCORE',
    });
  },

  down: (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'winType');
    await queryInterface.removeColumn('users', 'status2');
    return queryInterface.removeColumn('users', 'status1');
  }
};
