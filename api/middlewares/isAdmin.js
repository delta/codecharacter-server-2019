const User = require('../models').user;

module.exports = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.user.id,
      },
    });

    if (user) return next();
    return res.status(401).json({
      type: 'Error',
      error: 'Not an admin',
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
};
