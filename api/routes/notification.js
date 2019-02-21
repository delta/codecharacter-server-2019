const express = require('express');
const { check } = require('express-validator/check');
const { Op } = require('sequelize');
const { handleValidationErrors } = require('../utils/validation');
const Notification = require('../models').notification;
const isAdmin = require('../middlewares/isAdmin');
const GlobalNotification = require('../models').globalnotification;
const DeletedGlobalNotifications = require('../models').globalnotificationsdeleted;

const router = express.Router();

router.delete('/delete/:id', [
  check('id')
    .exists().withMessage('notification id is required'),
], async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) return null;
    const { id } = req.params;
    const userId = req.user.id;
    const deletedRows = await Notification.destroy({
      where: {
        id,
        userId,
      },
    });
    if (deletedRows) {
      return res.status(200).json({
        type: 'Success',
        error: '',
      });
    }
    return res.status(400).json({
      type: 'Error',
      error: 'Notification does not exist',
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.delete('/delete/type/:type', [
  check('type')
    .exists().withMessage('Notification type is required'),
], async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) return null;
    const { type } = req.params;
    const userId = req.user.id;
    const deletedRows = await Notification.destroy({
      where: {
        type,
        userId,
      },
    });
    if (deletedRows) {
      return res.status(200).json({
        type: 'Success',
        error: '',
      });
    }
    return res.status(400).json({
      type: 'Error',
      error: 'Notification does not exist',
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.post('/global/', isAdmin, [
  check('message')
    .not().isEmpty().withMessage('Message cannot be empty'),
], async (req, res) => {
  if (handleValidationErrors(req, res)) return null;
  try {
    const { message } = req.body;
    await GlobalNotification.create({ message });
    return res.status(200).json({
      type: 'Success',
      error: '',
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.get('/global/', async (req, res) => {
  try {
    const deletions = await DeletedGlobalNotifications.findAll({
      where: { userId: req.user.id },
      attributes: ['notificationId'],
    });
    const deletedNotificationIds = deletions.map(deletion => deletion.notificationId);
    const notifications = await GlobalNotification.findAll({
      where: {
        id: { [Op.notIn]: deletedNotificationIds },
      },
      attributes: ['id', 'message'],
    });

    return res.status(200).json({
      type: 'Success',
      error: '',
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.delete('/global/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const deletionEntry = await DeletedGlobalNotifications.findOne({
      where: {
        notificationId,
        userId: req.user.id,
      },
    });
    if (!deletionEntry) {
      await DeletedGlobalNotifications.create({
        notificationId,
        userId: req.user.id,
      });
    }
    return res.status(200).json({
      type: 'Success',
      error: '',
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

module.exports = router;
