const User = require('../models').user;
const socketHandlers = require('../utils/socketHandlers');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.user.id,
      },
    });

    if (user.activated) return next();
    socketHandlers.sendMessage(req.user.id, 'You account is not activated. Please check your email.', 'Activation error');
    return res.status(401).json({
      type: 'Error',
      error: 'Email not activated',
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
};
