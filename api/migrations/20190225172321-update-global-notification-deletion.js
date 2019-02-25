'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('globalnotificationsdeleted', 'notificationId');
    
    return queryInterface.addColumn(
      'globalnotificationsdeleted',
      'notificationId', {
        allowNull: false,
        type: Sequelize.BIGINT,
        foreignKey: true,
        references: {
          model: 'globalnotifications',
          key: 'id',
        },
      });

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('globalnotificationsdeleted', 'notificationId');
    
    return queryInterface.addColumn(
      'globalnotificationsdeleted',
      'notificationId', {
        allowNull: false,
        type: Sequelize.BIGINT,
        unique:true,
        foreignKey: true,
        references: {
          model: 'globalnotifications',
          key: 'id',
        },
      });
  }
};
