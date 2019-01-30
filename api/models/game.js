const User = require('./user');
const Match = require('./match');

module.exports = (sequelize, DataTypes) => {
  const game = sequelize.define('game', {
    user_id_1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    user_id_2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    match_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      foreignKey: true,
      references: {
        model: Match,
        key: 'id',
      },
    },
    debug_log_1_path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    debug_log_2_path: {
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
  }, {});
  // game.associate = function (models) {
  //   // associations can be defined here
  // };
  return game;
};
