const express = require('express');
const { notification } = require('../models');

const router = express.Router();

router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const deletedRows = await notification.destroy({
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

router.delete('/delete/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.id;
    const deletedRows = await notification.destroy({
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
