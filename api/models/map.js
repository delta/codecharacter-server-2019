module.exports = (sequelize, DataTypes) => {
  const map = sequelize.define('map', {
    path: {
      allowNull: false,
      type: DataTypes.STRING,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {});
  return map;
};
