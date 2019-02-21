const User = require('./user');
const GlobalNotification = require('./globalnotification');

module.exports = (sequelize, DataTypes) => {
  const globalnotificationsdeleted = sequelize.define('globalnotificationsdeleted', {
    userId: {
      allowNull: false,
      type: DataTypes.BIGINT,
      unique: true,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    notificationId: {
      allowNull: false,
      type: DataTypes.BIGINT,
      unique: true,
      foreignKey: true,
      references: {
        model: GlobalNotification,
        key: 'id',
      },
    },
  }, {
    freezeTableName: true,
    tableName: 'globalnotificationsdeleted',
  });
  globalnotificationsdeleted.associate = (models) => {
    globalnotificationsdeleted.belongsTo(models.user, { foreignKey: 'userId' });
    globalnotificationsdeleted.belongsTo(models.globalnotification, { foreignKey: 'notificationId' });
  };
  return globalnotificationsdeleted;
};
