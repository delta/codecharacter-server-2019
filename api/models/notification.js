const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const notification = sequelize.define('notification', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    group: {
      type: DataTypes.ENUM,
      values: ['Info', 'Success', 'Error'],
    },
    category: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
  }, {});
  // notification.associate = function(models) {
  //   // associations can be defined here
  // };
  return notification;
};
