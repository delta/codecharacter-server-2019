
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('users', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    username: {
      allowNull: false,
      type: Sequelize.STRING,
      unique: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    country: {
      type: Sequelize.STRING,
      defaultValue: 'IN'
    },
    activated: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    activationToken: Sequelize.STRING,
    expiry: Sequelize.DATE,
    fullName: {
      type: Sequelize.STRING,
      allowNull: false
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
