'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'notifications',
      'category', {
        type: Sequelize.STRING
      }
    );
    await queryInterface.addColumn(
      'notifications',
      'group', {
        type: Sequelize.ENUM,
        values: ['Info', 'Success', 'Error'],
      }
    );
    return queryInterface.removeColumn(
      'notifications',
      'type'
    );
    /*
    Add altering commands here.
    Return a promise to correctly handle asynchronicity.
    
    Example:
    return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'notifications',
      'group'
    );
    await queryInterface.addColumn(
      'notifications',
      'type', {
        type: Sequelize.ENUM,
        values: ['Info', 'Success', 'Error'],
      }
    );
    return queryInterface.removeColumn(
      'notifications',
      'category'
    );
    /*
    Add reverting commands here.
    Return a promise to correctly handle asynchronicity.
    
    Example:
    return queryInterface.dropTable('users');
    */
  }
};
