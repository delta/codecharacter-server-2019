
const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const CompileQueue = sequelize.define('CompileQueue', {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
    },
    code: DataTypes.STRING,
  }, {});
  // CompileQueue.associate = function(models) {
  //   // associations can be defined here
  // };
  return CompileQueue;
};
