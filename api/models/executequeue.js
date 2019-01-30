const User = require('./user');
const Match = require('./match');
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
    matchId: {
      type: DataTypes.STRING,
      references: {
        model: Match,
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
