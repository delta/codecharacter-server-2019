const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const match = sequelize.define('match', {
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
    verdict: {
      type: DataTypes.ENUM,
      values: ['0', '1', '2'],
    },
  }, {});
  // match.associate = function (models) {
  //   // associations can be defined here
  // };
  return match;
};
