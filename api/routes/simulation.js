const express = require('express');

const router = express.Router();
const git = require('../utils/gitHandlers');
const Constant = require('../models').constant;
const Match = require('../models').match;
const Game = require('../models').game;
const { pushToQueue, processMatchCompletion } = require('../utils/executeQueueHandler');
const User = require('../models').user;

const getUserName = async userId => User.findOne({
  where: {
    id: userId,
  },
}).then(user => user.dataValues.username)
  .catch(() => null);

router.get('/gamedone', async (req, res) => {
  res.sendStatus(200);
  processMatchCompletion(res);
});
router.post('/match/:userId2', async (req, res) => {
  let { userId2 } = req.params;
  userId2 = Number(userId2);
  const userId1 = req.user.id;
  const userName1 = req.user.username;
  const userName2 = await getUserName(userId2);
  const dll1 = await git.getFile(userName1, 'one.dll');
  const dll2 = await git.getFile(userName2, 'two.dll');

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
      user_id_1: userId1,
      user_id_2: { $ne: userId1 },
    },
    order: ['updatedAt'],
    attributes: ['id', 'createdAt', 'updatedAt'],
  }).then((matches) => {
    const now = new Date();
    const mostRecent = matches.pop();
    if (mostRecent) {
      if ((now.getTime() - mostRecent.createdAt.getTime()) < WAIT_TIME_CHALLENGE * 60 * 1000) {
        const timeLeft = WAIT_TIME_CHALLENGE
          - (now.getTime() - mostRecent.updatedAt.getTime()) / 60000;
        const minutes = Math.floor(timeLeft);
        const seconds = Math.floor((timeLeft - minutes) * 60);
        res.status(400).json({
          success: false,
          message: `Please wait for ${minutes} minutes and ${seconds} seconds to start a match with this user again`,
          time_left: WAIT_TIME_CHALLENGE - (now.getTime() - mostRecent.updatedAt.getTime()) / 60000,
          minutes,
          seconds,
        });
        return Promise.reject(new Error('triggered_manually'));
      }
    }
    return Promise.resolve(true);
  }).then(() => Match.create({
    user_id_1: userId1,
    user_id_2: userId2,
    match_log: '',
    status: 'executing',
  })).then(async (match) => {
    const promises = [];
    for (let i = 0; i < 5; i += 1) {
      const game = Game.create({
        user_id_1: userId1,
        user_id_2: userId1,
        match_id: match.id,
        debug_log_1_path: 'dummypath',
        debug_log_2_path: 'dummypath',
        log: '',
        points1: 0,
        points2: 0,
        mapId: i,
      });
      promises.push(pushToQueue(userId1, userId2, dll1, dll2, false, game.id));
    }
    await Promise.all(promises);
  })
    .then(() => {
      res.status(200).json({
        message: 'match initiated',
      });
    })
    .catch((err) => {
      if (err.message !== 'triggered_manually') {
        res.status(500).json({ success: false, message: 'Internal server error!', err });
      }
    });
  // find the last match initiated by user1, from both match model and
  // executequeue model and do the timechecking sww, get time checking constant from constants table

  // send notifications to userId1 and userId2
});

router.get('/ai/:ai_id', async (req, res) => {
  // ALWAYS COMPILE AND RUN
  const { userId } = req.user;
  const { aiId } = req.params;
  const userName1 = await getUserName(userId);
  const userName2 = await getUserName(aiId);

  // get 2 dlls
  // execute them and send back
  const dll1 = await git.getFile(userName1, 'one.dll');
  const dll2 = await git.getFile(userName2, 'two.dll');
  Match.create({
    player_id1: userId,
    player_id2: aiId,
    match_log: '',
    status: 'executing',
  }).then(match => pushToQueue(userId, aiId, dll1, dll2, true, match.id)).then(() => {
    res.status(200).json({
      message: 'match initiated',
    });
  })
    .catch((err) => {
      res.status(500).json({ success: false, message: 'Internal server error!', err });
    });
});
router.get('/nextmatchtime', (req, res) => {
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
    .catch(() => {
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
        const timeLeft = WAIT_TIME_CHALLENGE
          - (now.getTime() - mostRecent.updatedAt.getTime()) / 60000;
        const minutes = Math.floor(timeLeft);
        const seconds = Math.floor((timeLeft - minutes) * 60);
        return res.status(200).json({
          success: true,
          message: `Please wait for ${minutes} minutes and ${seconds} seconds to start a match with this user again`,
          time_left: WAIT_TIME_CHALLENGE - (now.getTime() - mostRecent.updatedAt.getTime()) / 60000,
          minutes,
          seconds,
        });
      }
    }
    return res.status(200).json({
      success: true,
      message: `Please wait for ${0} minutes and ${0} seconds to start a match with this user again`,
      time_left: 0,
      minutes: 0,
      seconds: 0,
    });
  })
    .catch(() => {
      res.json({ success: false, message: 'Internal Server Error' });
    });
});
router.get('/self', async (req, res) => {
  const userId = req.user.id;
  const { username } = req.user;
  // get 2 dlls
  // execute them and send back
  const dll1 = await git.getFile(username, 'one.dll');
  const dll2 = await git.getFile(username, 'two.dll');
  Match.create({
    user_id_1: userId,
    user_id_2: userId,
    match_log: 'sda',
    status: 'executing',
  }).then(match => pushToQueue(userId, userId, dll1, dll2, true, match.id)).then(() => {
    res.status(200).json({
      message: 'match initiated',
    });
  })
    .catch((err) => {
      res.status(500).json({ success: false, message: 'Internal server error!', err });
    });
});
module.exports = router;
