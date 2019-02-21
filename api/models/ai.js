module.exports = (sequelize, DataTypes) => {
  const ai = sequelize.define('ai', {
    dllPath: {
      allowNull: false,
      type: DataTypes.STRING,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {});
  return ai;
};
