'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ExecuteQueues', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dll1: {
        type: Sequelize.BLOB
      },
      dll2: {
        type: Sequelize.BLOB
      },
      userId1: {
        type: Sequelize.INTEGER,
        references: {
          models: 'users',
          key: 'id'
        }
      },
      userId2: {
        type: Sequelize.INTEGER,
        references: {
          models: 'users',
          key: 'id'
        }
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
    return queryInterface.dropTable('ExecuteQueues');
  }
};