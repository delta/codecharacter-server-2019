
module.exports = (sequelize, DataTypes) => {
  const constant = sequelize.define('constant', {
    key: DataTypes.STRING,
    value: {
      type: DataTypes.STRING,
    },
  }, {});
  // constant.associate = function (models) {
  //   // associations can be defined here
  // };
  return constant;
};
