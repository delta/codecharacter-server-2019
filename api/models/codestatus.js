const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const codeStatus = sequelize.define('codestatus', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    latestSrcPath: {
      type: DataTypes.TEXT('long'),
    },
    status: {
      type: DataTypes.ENUM,
      values: ['Idle', 'Waiting', 'Compiling', 'Compiled', 'Error', 'Executing', 'Executed'],
      defaultValue: 'Idle',
    },
    lastSavedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Date.now(), // current time
    },
    lastCompiledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(0), // epoch start time
    },
  }, {
    freezeTableName: true,
    tableName: 'codestatus',
  });
  // CodeStatus.associate = function(models) {
    // associations can be defined here
  // };
  return codeStatus;
};
