module.exports = (sequelize, DataTypes) => {
  const globalnotification = sequelize.define('globalnotification', {
    message: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
  }, {});
  return globalnotification;
};
