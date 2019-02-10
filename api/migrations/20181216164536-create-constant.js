
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('constants', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    key: {
      type: Sequelize.STRING,
    },
    value: {
      type: Sequelize.STRING,
    }
  }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('constants'),
};
