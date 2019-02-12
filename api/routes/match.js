const express = require('express');

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
      $or: [{
        userId1: req.user.id,
      }, {
        userId2: req.user.id,
      }],
    },
  });
  const matchData = [];
  matches = parsify(matches);
  for (let i = 0; i < matches.length; i += 1) {
    const matchEntry = {};
    matchEntry.usedId1 = matches[i].user1.id;
    matchEntry.userId2 = matches[i].user2.id;
    matchEntry.username1 = matches[i].user1.username;
    matchEntry.username2 = matches[i].user2.username;
    matchEntry.verdict = matches[i].verdict;
    matchEntry.score1 = matches[i].score1;
    matchEntry.score2 = matches[i].score2;
    matchData.push(matchEntry);
  }
  return res.status(200).json({ type: 'Success', error: '', matchData });
});

router.get('/pro', async (req, res) => {
  let leaderboard = await Leaderboard.findAll({
    include: {
      model: User,
    },
    order: ['rating'],
  });
  leaderboard = parsify(leaderboard);
  let allMatches = await Match.findAll({
    where: {
      status: 'DONE',
    },
  });
  allMatches = parsify(allMatches);
  let count = 10;
  const result = [];
  for (let diff = 0; diff <= 5; diff += 1) {
    for (let index = 0; index < allMatches.length; index += 1) {
      const match = allMatches[index];
      if (Math.abs(match.score1 - match.score2) === diff) {
        for (let player = 0; player < leaderboard.length; player += 1) {
          const curPlayer = leaderboard[player];
          if (match.userId1 === curPlayer.userId || match.userId2 === curPlayer.userId) {
            if (!allMatches[index].isUsed) {
              if (count !== 0) {
                result.push(match);
                allMatches[index].isUsed = true;
                count -= 1;
              }
            }
          }
        }
      }
    }
  }
  return res.status(200).json({ type: 'Success', error: '', matchData: result });
});

module.exports = router;
