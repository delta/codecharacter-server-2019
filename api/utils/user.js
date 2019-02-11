const User = require('../models').user;

const getUsername = async (userId) => {
  try {
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (user) return user.username;
    return '';
  } catch (err) {
    return '';
  }
};

module.exports = {
  getUsername,
};
