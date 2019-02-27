const User = require('./user');
const Match = require('./match');
const Map = require('./map');

module.exports = (sequelize, DataTypes) => {
  const game = sequelize.define('game', {
    userId1: {
      type: DataTypes.BIGINT,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    userId2: {
      type: DataTypes.BIGINT,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    matchId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      foreignKey: true,
      references: {
        model: Match,
        key: 'id',
      },
    },
    debugLog1Path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    debugLog2Path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    log: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM,
      values: ['Idle', 'Waiting', 'Compiling', 'Compiled', 'Error', 'Executing', 'Executed'],
      defaultValue: 'Idle',
    },
    verdict: {
      type: DataTypes.ENUM,
      values: ['0', '1', '2'],
      defaultValue: '0',
    },
    points1: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    points2: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    interestingness: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    mapId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      foreignKey: true,
      references: {
        model: Map,
        key: 'id',
      },
    },
    status1: {
      type: DataTypes.ENUM,
      values: ['UNDEFINED', 'NORMAL', 'EXCEEDED_INSTRUCTION_LIMIT', 'RUNTIME_ERROR', 'TIMEOUT'],
      allowNull: false,
      defaultValue: 'NORMAL',
    },
    status2: {
      type: DataTypes.ENUM,
      values: ['UNDEFINED', 'NORMAL', 'EXCEEDED_INSTRUCTION_LIMIT', 'RUNTIME_ERROR', 'TIMEOUT'],
      allowNull: false,
      defaultValue: 'NORMAL',
    },
    winType: {
      type: DataTypes.ENUM,
      values: ['DEATHMATCH', 'SCORE', 'EXCEEDED_INSTRUCTION_LIMIT', 'RUNTIME_ERROR', 'TIMEOUT', 'NONE'],
      allowNull: false,
      defaultValue: 'NORMAL',
    },
  }, {});
  return game;
};
