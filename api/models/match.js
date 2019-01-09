const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const match = sequelize.define('match', {
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
    match_log: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM,
      values: ['Idle', 'Waiting', 'Compiling', 'Compiled', 'Error', 'Executing', 'Executed'],
      defaultValue: 'Idle',
    },
  }, {});
  // match.associate = function (models) {
  //   // associations can be defined here
  // };
  return match;
};
