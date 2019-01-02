
module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    username: {
      allowNull: false,
      type: DataTypes.INTEGER,
      unique: true,
    },
    email: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'IN',
    },
    activated: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    activationToken: DataTypes.STRING,
    expiry: DataTypes.DATE,
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
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
