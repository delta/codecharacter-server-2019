'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('codestatus', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        foreignKey: true,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      latestSrcPath: {
        type: Sequelize.TEXT('long')
      },
      status: {
        type: Sequelize.ENUM,
        values: ['Idle', 'Waiting', 'Compiling', 'Compiled', 'Error', 'Executing', 'Executed'],
        defaultValue: 'Idle'
      },
      lastSavedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      lastCompiledAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('codestatus');
  }
};
