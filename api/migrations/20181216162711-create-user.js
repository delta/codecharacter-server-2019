
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('users', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    password: Sequelize.STRING,
    country: Sequelize.STRING,
    activated: Sequelize.BOOLEAN,
    activationToken: Sequelize.STRING,
    expiry: Sequelize.DATE,
    name: {
      type: Sequelize.STRING,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    pragyanId: {
      allowNull: true,
      type: Sequelize.INTEGER
    }
  }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('users'),
};
