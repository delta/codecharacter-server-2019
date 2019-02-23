const Notification = require('../models').notification;

const createNotification = async (category, group, title, content, userId) => {
  try {
    await Notification.create({
      category, group, title, content, userId,
    });
    return true;
  } catch (err) {
    return false;
  }
};

module.exports = {
  createNotification,
};
