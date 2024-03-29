
const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const compileQueue = sequelize.define('compilequeue', {
    userId: {
      type: DataTypes.BIGINT,
      references: {
        model: User,
        key: 'id',
      },
      allowNull: false,
    },
    codePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    commitHash: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'latest',
    },
    status: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ['QUEUED', 'COMPILING', 'DONE'],
      defaultValue: 'QUEUED',
    },
  }, {
    freezeTableName: true,
    tableName: 'compilequeue',
  });
  return compileQueue;
};
