'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('executequeue', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId1: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false,
      },
      userId2: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false,
      },
      gameId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      dll1Path: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dll2Path: {
        type: Sequelize.STRING,
        allowNull: false,
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
    return queryInterface.dropTable('executequeue');
  }
};
