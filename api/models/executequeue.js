const User = require('./user');
const Map = require('./map');
const Game = require('./game');

module.exports = (sequelize, DataTypes) => {
  const executeQueue = sequelize.define('executequeue', {
    userId1: {
      type: DataTypes.BIGINT,
      references: {
        model: User,
        key: 'id',
      },
      allowNull: false,
    },
    userId2: {
      type: DataTypes.BIGINT,
      references: {
        model: User,
        key: 'id',
      },
      allowNull: false,
    },
    gameId: {
      type: DataTypes.BIGINT,
      references: {
        model: Game,
        key: 'id',
      },
      allowNull: true,
    },
    dll1Path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dll2Path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ['QUEUED', 'EXECUTING', 'DONE'],
      defaultValue: 'QUEUED',
    },
    type: {
      type: DataTypes.ENUM,
      values: ['USER_MATCH', 'SELF_MATCH', 'PREVIOUS_COMMIT_MATCH', 'AI_MATCH'],
      allowNull: false,
      defaultValue: 'USER_MATCH',
    },
    mapId: {
      type: DataTypes.BIGINT,
      references: {
        model: Map,
        key: 'id',
      },
      allowNull: false,
    },
  }, {
    freezeTableName: true,
    tableName: 'executequeue',
  });
  return executeQueue;
};
