const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const Commit = sequelize.define('Commit', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    commitHash: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    codePath: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
  }, {});
  // Commit.associate = function(models) {
    // associations can be defined here
  // };

  return Commit;
};
