const express = require('express');

const Match = require('../models').match;
const User = require('../models').user;

const router = express.Router();
const parsify = obj => JSON.parse(JSON.stringify(obj));
router.get('/all', async (req, res) => {
  let matches = await Match.findAll({
    include: [
      { model: User, as: 'user1' },
      { model: User, as: 'user2' },
    ],
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

module.exports = router;
