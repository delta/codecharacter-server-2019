const express = require('express');
const { check } = require('express-validator/check');
const { Op } = require('sequelize');
const { handleValidationErrors } = require('../utils/validation');
const isAdmin = require('../middlewares/isAdmin');
const GlobalNotification = require('../models').globalnotification;
const DeletedGlobalNotifications = require('../models').globalnotificationsdeleted;

const router = express.Router();

router.post('/', isAdmin, [
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

router.get('/', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    await DeletedGlobalNotifications.create({
      notificationId,
      userId: req.user.id,
    });
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
