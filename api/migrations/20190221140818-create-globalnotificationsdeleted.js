'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('globalnotificationsdeleted', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      userId: {
        allowNull: false,
        type: Sequelize.BIGINT,
        unique: true,
        foreignKey: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      notificationId: {
        allowNull: false,
        type: Sequelize.BIGINT,
        unique: true,
        foreignKey: true,
        references: {
          model: 'globalnotifications',
          key: 'id',
        },
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
    return queryInterface.dropTable('globalnotificationsdeleted');
  }
};
