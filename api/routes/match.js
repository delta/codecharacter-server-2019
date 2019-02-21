const express = require('express');
const { Op } = require('sequelize');

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

  matches.forEach((match) => {
    const matchEntry = {};
    matchEntry.usedId1 = match.user1.id;
    matchEntry.userId2 = match.user2.id;
    matchEntry.username1 = match.user1.username;
    matchEntry.username2 = match.user2.username;
    matchEntry.verdict = match.verdict;
    matchEntry.score1 = match.score1;
    matchEntry.score2 = match.score2;
    matchEntry.playedAt = (new Date(match.updatedAt)).toUTCString();
    matchData.push(matchEntry);
  });

  return res.status(200).json({ type: 'Success', error: '', matchData });
});

router.get('/pro', async (req, res) => {
  const proMatches = [];
  let proMatchesData = await Match.findAll({
    include: [
      { model: User, as: 'user1' },
      { model: User, as: 'user2' },
    ],
    where: {
      status: 'DONE',
    },
    order: [['interestingness', 'DESC']],
    limit: 10,
  });

  proMatchesData = parsify(proMatchesData);

  proMatchesData.forEach((proMatch) => {
    const matchEntry = {};
    matchEntry.usedId1 = proMatch.user1.id;
    matchEntry.userId2 = proMatch.user2.id;
    matchEntry.username1 = proMatch.user1.username;
    matchEntry.username2 = proMatch.user2.username;
    matchEntry.verdict = proMatch.verdict;
    matchEntry.score1 = proMatch.score1;
    matchEntry.score2 = proMatch.score2;
    matchEntry.playedAt = (new Date(proMatch.updatedAt)).toUTCString();
    proMatches.push(matchEntry);
  });

  return res.status(200).json({ type: 'Success', error: '', matchData: proMatches });
});

module.exports = router;
