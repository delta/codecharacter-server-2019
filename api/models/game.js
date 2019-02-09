const User = require('./user');
const Match = require('./match');
const Map = require('./map');

module.exports = (sequelize, DataTypes) => {
  const game = sequelize.define('game', {
    userId1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    userId2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    matchId: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    points2: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mapId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      foreignKey: true,
      references: {
        model: Map,
        key: 'id',
      },
    },
  }, {});
  return game;
};
