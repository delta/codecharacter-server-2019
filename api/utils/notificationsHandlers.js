const Notification = require('../models').notification;

const createNotification = async (type, title, content, userId) => {
  try {
    await Notification.create({
      type, title, content, userId,
    });
    return true;
  } catch (err) {
    return false;
  }
};

exports = {
  createNotification,
};
