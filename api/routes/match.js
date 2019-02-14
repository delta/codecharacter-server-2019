const express = require('express');
const { Op } = require('sequelize');

const Match = require('../models').match;
const Leaderboard = require('../models').leaderboard;
const User = require('../models').user;

const router = express.Router();
const parsify = obj => JSON.parse(JSON.stringify(obj));
router.get('/all', async (req, res) => {
  let matches = await Match.findAll({
    include: [
      { model: User, as: 'user1' },
      { model: User, as: 'user2' },
    ],
    where: {
      [Op.or]: [{
        userId1: req.user.id,
      }, {
        userId2: req.user.id,
      }],
    },
  });
  const matchData = [];
  matches = parsify(matches);
  matches.array.forEach((element) => {
    const matchEntry = {};
    matchEntry.usedId1 = element.user1.id;
    matchEntry.userId2 = element.user2.id;
    matchEntry.username1 = element.user1.username;
    matchEntry.username2 = element.user2.username;
    matchEntry.verdict = element.verdict;
    matchEntry.score1 = element.score1;
    matchEntry.score2 = element.score2;
    matchData.push(matchEntry);
  });
  return res.status(200).json({ type: 'Success', error: '', matchData });
});

router.get('/pro', async (req, res) => {
  let leaderboard = await Leaderboard.findAll({
    include: {
      model: User,
    },
    order: ['rating'],
    limit: 10,
  });
  leaderboard = parsify(leaderboard);

  const topPlayers = [];
  for (let index = 0; index < leaderboard.length; index += 1) {
    topPlayers.push(leaderboard[index].userId);
  }
  let allMatches = await Match.findAll({
    where: {
      status: 'DONE',
      userId1: {
        [Op.or]: topPlayers,
      },
      userId2: {
        [Op.or]: topPlayers,
      },
    },
  });
  allMatches = parsify(allMatches);
  let count = 10;
  const result = [];
  for (let diff = 0; diff <= 5; diff += 1) {
    for (let index = 0; index < allMatches.length; index += 1) {
      const match = allMatches[index];
      if (Math.abs(match.score1 - match.score2) === diff) {
        if (count !== 0) {
          result.push(match);
          count -= 1;
        }
      }
    }
  }
  return res.status(200).json({ type: 'Success', error: '', matchData: result });
});

module.exports = router;
