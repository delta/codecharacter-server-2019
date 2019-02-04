const User = require('./user');
const Game = require('./game');

module.exports = (sequelize, DataTypes) => {
  const ExecuteQueue = sequelize.define('ExecuteQueue', {
    dll1: DataTypes.BLOB,
    dll2: DataTypes.BLOB,
    userId1: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
    },
    userId2: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
    },
    gameId: {
      type: DataTypes.STRING,
      references: {
        model: Game,
        key: 'id',
      },
    },
    isAi: DataTypes.BOOLEAN,
  }, {});
  // ExecuteQueue.associate = function(models) {
  //   // associations can be defined here
  // };
  return ExecuteQueue;
};
