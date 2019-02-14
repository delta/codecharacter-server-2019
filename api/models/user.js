
module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    username: {
      allowNull: false,
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmpty(val, next) {
          if (val.length >= 1) return next();
          return next('username cannot be empty');
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
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
      validate: {
        isEmpty(val, next) {
          if (val.length >= 1) return next();
          return next('fullName cannot be empty');
        },
      },
    },
    pragyanId: {
      allowNull: true,
      type: DataTypes.BIGINT,
    },
    type: {
      allowNull: false,
      type: DataTypes.ENUM,
      values: ['Student', 'Professional'],
      defaultValue: 'Professional',
    },
    college: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isPragyan: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isAdmin: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {});
  // user.associate = function (models) {
  //   // associations can be defined here
  // };
  return user;
};
