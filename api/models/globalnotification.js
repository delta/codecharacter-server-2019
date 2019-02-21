module.exports = (sequelize, DataTypes) => {
  const globalnotification = sequelize.define('globalnotification', {
    message: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
  }, {});
  // globalnotification.associate = function(models) {
  //   // associations can be defined here
  // };
  return globalnotification;
};
