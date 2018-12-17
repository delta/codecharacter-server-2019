
module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    name: DataTypes.STRING,
    password: DataTypes.STRING,
    country: DataTypes.STRING,
    activated: DataTypes.BOOLEAN,
    activationToken: DataTypes.STRING,
    expiry: DataTypes.DATE,
    pragyanId: {
      allowNull: true,
      type: DataTypes.INTEGER,
    },
  }, {});
  // user.associate = function (models) {
  //   // associations can be defined here
  // };
  return user;
};
