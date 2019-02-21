module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('ais', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    name: {
      allowNull: false,
      type: Sequelize.STRING,
      unique: true
    },
    dllPath: {
      allowNull: false,
      type: Sequelize.STRING,
      unique: true,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('ais'),
};
