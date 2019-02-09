module.exports = (sequelize, DataTypes) => {
  const compilebox = sequelize.define('compilebox', {
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM,
      values: ['IDLE', 'BUSY'],
      defaultValue: 'IDLE',
      allowNull: false,
    },
  }, {});
  return compilebox;
};
