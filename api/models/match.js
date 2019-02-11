const User = require('./user');

module.exports = (sequelize, DataTypes) => {
  const match = sequelize.define('match', {
    userId1: {
      type: DataTypes.BIGINT,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    userId2: {
      type: DataTypes.BIGINT,
      allowNull: false,
      foreignKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    verdict: {
      type: DataTypes.ENUM,
      values: ['0', '1', '2'],
    },
    status: {
      type: DataTypes.ENUM,
      values: ['QUEUED', 'EXECUTING', 'DONE'],
      allowNull: false,
      defaultValue: 'QUEUED',
    },
    score1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    score2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    interestingness: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
  }, {});
  match.associate = (models) => {
    match.belongsTo(models.user, { as: 'user1', foreignKey: 'userId1' });
    match.belongsTo(models.user, { as: 'user2', foreignKey: 'userId2' });
  };
  return match;
};
