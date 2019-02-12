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
  const MatchEntry = [];
  matches = parsify(matches);
  for (let i = 0; i < matches.length; i += 1) {
    const match = {};
    match.usedId1 = matches[i].user1.id;
    match.userId2 = matches[i].user2.id;
    match.username1 = matches[i].user1.username;
    match.username2 = matches[i].user2.username;
    match.verdict = matches[i].verdict;
    match.score1 = matches[i].score1;
    match.score2 = matches[i].score2;
    MatchEntry.push(match);
  }
  return res.status(200).json({ type: 'Success', error: '', matchData: MatchEntry });
});

module.exports = router;
