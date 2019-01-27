const express = require('express');

const router = express.Router();
const git = require('../utils/gitHandlers');
const ExecuteQueue = require('../models').executequeue;
const Constant = require('../models').constant;
const Match = require('../models').match;
const { pushToQueue } = require('../utils/executeQueueHandler');

router.post('/comptete/:userId1/:userId2', async (req, res) => {
  const { userId1, userId2 } = req.params;
  const dll1 = await git.getFile(userId1, 'one.dll');
  const dll2 = await git.getFile(userId2, 'two.dll');

  let WAIT_TIME_CHALLENGE;
  Constant.findOne({
    where: {
      key: 'WAIT_TIME_CHALLENGE',
    },
  }).then((constant) => {
    WAIT_TIME_CHALLENGE = constant.value;
    if (!constant) {
      WAIT_TIME_CHALLENGE = 30;
    }
  })
    .catch(() => {
      WAIT_TIME_CHALLENGE = 30;
    });
  Match.findAll({
    where: {
      userId1,
      userId2: { $ne: userId1 },
    },
    order: ['updatedAt'],
    attributes: ['id', 'createdAt', 'updatedAt'],
  }).then((matches) => {
    const now = new Date();
    const mostRecent = matches.pop();
    if (mostRecent) {
      if ((now.getTime() - mostRecent.createdAt.getTime()) < WAIT_TIME_CHALLENGE * 60 * 1000) {
        const timeLeft = WAIT_TIME_CHALLENGE - (now.getTime() - mostRecent.updatedAt.getTime()) / 60000;
        const minutes = Math.floor(timeLeft);
        const seconds = Math.floor((timeLeft - minutes) * 60);
        return res.json({
          success: false,
          message: `Please wait for ${minutes} minutes and ${seconds} seconds to start a match with this user again`,
          time_left: WAIT_TIME_CHALLENGE - (now.getTime() - mostRecent.updatedAt.getTime()) / 60000,
          minutes,
          seconds,
        });
      }
    }
    return Promise.resolve(true);
  }).then(() => Match.create({
    player_id1: userId1,
    ai_id: userId2,
    match_log: '',
    status: 'executing',
  })).then(() => pushToQueue(userId1, userId2, dll1, dll2, false))
    .then(() => {
      res.status(200).json({
        message: 'match initiated',
      });
    })
    .catch((err) => {
      res.status(500).json({ success: false, message: 'Internal server error!', err });
    });
  // find the last match initiated by user1, from both match model and
  // executequeue model and do the timechecking sww, get time checking constant from constants table

  // send notifications to userId1 and userId2
});

router.get('/compete/ai/:ai_id', async (req, res) => {
  // ALWAYS COMPILE AND RUN
  const { userId } = req.user;
  const { aiId } = req.params;
  // get 2 dlls
  // execute them and send back
  const dll1 = await git.getFile(userId, 'one.dll');
  const dll2 = await git.getFile(aiId, 'two.dll');
  Match.create({
    player_id1: userId,
    player_id2: aiId,
    match_log: '',
    status: 'executing',
  }).then(() => pushToQueue(userId, aiId, dll1, dll2, true)).then(() => {
    res.status(200).json({
      message: 'match initiated',
    });
  })
    .catch((err) => {
      res.status(500).json({ success: false, message: 'Internal server error!', err });
    });
});
router.get('/compete/nextmatchtime', (req, res) => {
  // copy the time calculations from execute match route and paste it here
  let WAIT_TIME_CHALLENGE;
  Constant.findOne({
    where: {
      key: 'WAIT_TIME_CHALLENGE',
    },
  }).then((constant) => {
    WAIT_TIME_CHALLENGE = constant.value;
    if (!constant) {
      WAIT_TIME_CHALLENGE = 30;
    }
  })
    .catch((err) => {
      WAIT_TIME_CHALLENGE = 30;
    });
  const userId = req.user.id;
  Match.findAll({
    where: {
      userId1: userId,
      isAi: false,
      userId2: { $ne: userId },
    },
    order: ['updatedAt'],
    attributes: ['id', 'createdAt', 'updatedAt'],
  }).then((matches) => {
    const now = new Date();
    const mostRecent = matches.pop();
    if (mostRecent) {
      if ((now.getTime() - mostRecent.createdAt.getTime()) < WAIT_TIME_CHALLENGE * 60 * 1000) {
        const timeLeft = WAIT_TIME_CHALLENGE - (now.getTime() - mostRecent.updatedAt.getTime()) / 60000;
        const minutes = Math.floor(timeLeft);
        const seconds = Math.floor((timeLeft - minutes) * 60);
        return res.json({
          success: false,
          message: `Please wait for ${minutes} minutes and ${seconds} seconds to start a match with this user again`,
          time_left: WAIT_TIME_CHALLENGE - (now.getTime() - mostRecent.updatedAt.getTime()) / 60000,
          minutes,
          seconds,
        });
      }
    }
  })
    .catch((err) => {
      res.json({ success: false, message: 'Internal Server Error' });
    });
});
router.get('/compete/self', async (req, res) => {
  const { userId } = req.user;
  // get 2 dlls
  // execute them and send back
  const dll1 = await git.getFile(userId, 'one.dll');
  const dll2 = await git.getFile(userId, 'two.dll');
  Match.create({
    player_id1: userId,
    player_id2: userId,
    match_log: '',
    status: 'executing',
  }).then(() => pushToQueue(userId, userId, dll1, dll2, true)).then(() => {
    res.status(200).json({
      message: 'match initiated',
    });
  })
    .catch((err) => {
      res.status(500).json({ success: false, message: 'Internal server error!', err });
    });
});
module.exports = router;
