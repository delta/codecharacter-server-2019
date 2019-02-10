const express = require('express');
const { check } = require('express-validator/check');
const { handleValidationErrors } = require('../utils/validation');
const Notification = require('../models').notification;

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

module.exports = router;
