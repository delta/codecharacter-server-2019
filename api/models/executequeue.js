const User = require('./user');
const Map = require('./map');
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
      type: DataTypes.INTEGER,
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
    isSelf: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    mapId: {
      type: DataTypes.INTEGER,
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
