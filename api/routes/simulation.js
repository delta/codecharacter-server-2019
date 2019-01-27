const express = require('express');

const router = express.Router();
const git = require('../utils/git_handlers');
const ExecuteQueue = require('../models/executequeue');
const Match = require('../models/match');

router.post('/comptete/:userId1/:userId2', async (req, res) => {
  const { userId1, userId2 } = req.params;
  const dll1 = await git.getFile(userId1, 'one.dll');
  const dll2 = await git.getFile(userId2, 'two.dll');

  // find the last match initiated by user1, from both match model and
  // executequeue model and do the timechecking sww, get time checking constant from constants table

  // send notifications to userId1 and userId2
  Match.create({
    player_id1: userId1,
    ai_id: userId2,
    match_log: '',
    status: 'executing',
  }).then(() => ExecuteQueue.create({
    dll1,
    dll2,
    userId1,
    userId2,
    isAi: false,
  })).then(() => {
    res.status(200).json({
      message: 'match initiated',
    });
  })
    .catch((err) => {
      res.status(500).json({ success: false, message: 'Internal server error!', err });
    });
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
  }).then(() => ExecuteQueue.create({
    dll1,
    dll2,
    userId1: userId,
    userId2: aiId,
    isAi: true,
  })).then(() => {
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
  res.status(200).json({
    time: 100, // in seconds
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
  }).then(() => ExecuteQueue.create({
    dll1,
    dll2,
    userId1: userId,
    userId2: userId,
    isAi: true,
  })).then(() => {
    res.status(200).json({
      message: 'match initiated',
    });
  })
    .catch((err) => {
      res.status(500).json({ success: false, message: 'Internal server error!', err });
    });
});
module.exports = router;
