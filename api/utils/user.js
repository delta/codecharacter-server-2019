const User = require('../models').user;
const Leaderboard = require('../models').leaderboard;

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

const getRating = (async (userId) => {
  try {
    const user = await Leaderboard.findOne({
      where: {
        userId,
      },
    });
    if (user) return user.rating;
    return '';
  } catch (err) {
    return '';
  }
});

module.exports = {
  getUsername,
  getRating,
};
