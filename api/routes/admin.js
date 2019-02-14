const express = require('express');
const { Op } = require('sequelize');
const User = require('../models').user;
const models = require('../models');
const { sendJob } = require('../utils/job');
const { removeDir, removeLeaderboardDir } = require('../utils/gitHandlers');

const router = express.Router();

router.delete('/delete/:username', async (req, res) => {
  try {
    const user = await User.findOne({
      where: { username: req.params.username },
    });
    if (user) {
      const userId = user.id;
      await models.codestatus.destroy({
        where: {
          userId,
        },
      });
      await models.leaderboard.destroy({
        where: {
          userId,
        },
      });
      await models.compilequeue.destroy({
        where: {
          userId,
        },
      });
      await models.notification.destroy({
        where: {
          userId,
        },
      });
      await models.executequeue.destroy({
        where: {
          [Op.or]: [{ userId1: userId }, { userId2: userId }],
        },
      });
      await models.game.destroy({
        where: {
          [Op.or]: [{ userId1: userId }, { userId2: userId }],
        },
      });
      await models.match.destroy({
        where: {
          [Op.or]: [{ userId1: userId }, { userId2: userId }],
        },
      });
      await User.destroy({
        where: { username: req.params.username },
      });
      await removeDir(user.username);
      await removeLeaderboardDir(user.username);
      return res.status(200).json({
        type: 'Success',
        error: '',
      });
    }
    return res.status(400).json({
      type: 'Error',
      error: 'User not found',
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.post('/startjob', async (req, res) => {
  try {
    sendJob();
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
