module.exports = (sequelize, DataTypes) => {
  const game = sequelize.define('map', {
    path: {
      allowNull: false,
      type: DataTypes.STRING,
      unique: true,
    },
  }, {});
  return game;
};
