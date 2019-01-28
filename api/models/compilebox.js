module.exports = (sequelize, DataTypes) => {
  const compilebox = sequelize.define('compilebox', {
    url: DataTypes.STRING,
    tasks_running: DataTypes.INTEGER,
    maximum_tasks: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
  }, {});
  // compilebox.associate = function(models) {
  //   // associations can be defined here
  // };
  return compilebox;
};
