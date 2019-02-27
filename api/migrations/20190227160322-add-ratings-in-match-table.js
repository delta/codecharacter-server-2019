'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('matches', 'initialRating1', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
    await queryInterface.addColumn('matches', 'initialRating2', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
    await queryInterface.addColumn('matches', 'finalRating1', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
    return queryInterface.addColumn('matches', 'finalRating2', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('matches', 'initialRating1');
    await queryInterface.removeColumn('matches', 'initialRating2');
    await queryInterface.removeColumn('matches', 'finalRating1');
    return queryInterface.removeColumn('matches', 'finalRating2');
  }
};
