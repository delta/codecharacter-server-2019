const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const Commit = sequelize.define('Commit', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    commit_hash: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    code_path: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
  }, {});
  // Commit.associate = function(models) {
    // associations can be defined here
  // };

  return Commit;
};
