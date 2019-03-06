const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const DebugQueue = sequelize.define('debugqueue', {
    userId: {
      type: DataTypes.BIGINT,
      foreignKey: true,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    code1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code2: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    map: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ['QUEUED', 'EXECUTING', 'DONE'],
      defaultValue: 'QUEUED',
    },
  }, {
    freezeTableName: true,
    tableName: 'debugqueue',
  });
  DebugQueue.associate = function () {
    // associations can be defined here
  };
  return DebugQueue;
};
