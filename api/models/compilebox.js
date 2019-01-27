module.exports = (sequelize, DataTypes) => {
  const compilebox = sequelize.define('compilebox', {
    url: DataTypes.STRING,
    tasks_running: DataTypes.INTEGER,
  }, {});
  // compilebox.associate = function(models) {
  //   // associations can be defined here
  // };
  return compilebox;
};
