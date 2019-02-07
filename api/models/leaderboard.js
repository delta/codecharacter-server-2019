
const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const leaderboard = sequelize.define('leaderboard', {
    userId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      unique: true,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
    },
    dll1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dll2: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAi: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    freezeTableName: true,
    tableName: 'leaderboard',
  });
  leaderboard.associate = (models) => {
    leaderboard.belongsTo(models.user, { foreignKey: 'userId' });
  };
  return leaderboard;
};
