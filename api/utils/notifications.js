const { Op } = require('sequelize');
const Notification = require('../models').notification;
const GlobalNotification = require('../models').globalnotification;
const DeletedGlobalNotifications = require('../models').globalnotificationsdeleted;

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

const deleteGlobalNotification = async (notificationId, userId) => {
  const deletionEntry = await DeletedGlobalNotifications.findOne({
    where: {
      userId,
      notificationId,
    },
  });
  if (!deletionEntry) {
    await DeletedGlobalNotifications.create({
      notificationId,
      userId,
    });
  }
};

const getUnreadGlobalNotifications = async (userId) => {
  const deletions = await DeletedGlobalNotifications.findAll({
    where: {
      userId,
    },
    attributes: ['notificationId'],
  });

  const deletedNotificationIds = deletions.map(deletion => deletion.notificationId);

  const notifications = await GlobalNotification.findAll({
    where: {
      id: {
        [Op.notIn]: deletedNotificationIds,
      },
    },
    attributes: ['id', 'message'],
  });

  return notifications;
};

module.exports = {
  createNotification,
  deleteGlobalNotification,
  getUnreadGlobalNotifications,
};
