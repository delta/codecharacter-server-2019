const User = require('./user');
const Game = require('./game');

module.exports = (sequelize, DataTypes) => {
  const executeQueue = sequelize.define('executequeue', {
    userId1: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
      allowNull: false,
    },
    userId2: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
      allowNull: false,
    },
    gameId: {
      type: DataTypes.STRING,
      references: {
        model: Game,
        key: 'id',
      },
      allowNull: false,
    },
    dll1Path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dll2Path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    freezeTableName: true,
    tableName: 'executequeue',
  });
  return executeQueue;
};
