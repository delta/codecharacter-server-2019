'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('leaderboard', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      userId: {
        allowNull: false,
        type: Sequelize.BIGINT
      },
      rating: {
        type: Sequelize.BIGINT,
        defaultValue: 1000
      },
      dll1: {
        type: Sequelize.STRING,
        allowNull: false
      },
      dll2: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isAi: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('leaderboard');
  }
};
