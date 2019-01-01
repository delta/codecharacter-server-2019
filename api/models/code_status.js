import User from './user';

module.exports = (sequelize, DataTypes) => {
  const CodeStatus = sequelize.define('Code_Status', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    latest_src_path: {
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
    },
    lastCompiledAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {});
  // CodeStatus.associate = function(models) {
    // associations can be defined here
  // };
  return CodeStatus;
};
