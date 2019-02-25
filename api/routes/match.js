const express = require('express');
const { Op } = require('sequelize');

const Match = require('../models').match;
const Game = require('../models').game;
const User = require('../models').user;

const git = require('../utils/gitHandlers');
const constantUtils = require('../utils/constant');

const router = express.Router();
const parsify = obj => JSON.parse(JSON.stringify(obj));

router.get('/all', async (req, res) => {
  const { id } = req.user;

  let matches = await Match.findAll({
    include: [
      { model: User, as: 'user1' },
      { model: User, as: 'user2' },
    ],
    where: {
      [Op.or]: [{
        userId1: id,
      }, {
        userId2: id,
      }],
    },
    order: [['createdAt', 'DESC']],
  });

  const matchData = [];
  matches = parsify(matches);

  await Promise.all(matches.map(async (match) => {
    const games = await Game.findAll({
      where: {
        matchId: match.id,
      },
      attributes: ['id', 'mapId', 'status', 'verdict'],
    });

    const matchEntry = {};
    matchEntry.usedId1 = match.user1.id;
    matchEntry.userId2 = match.user2.id;
    matchEntry.username1 = match.user1.username;
    matchEntry.username2 = match.user2.username;
    matchEntry.avatar1 = match.user1.avatar;
    matchEntry.avatar2 = match.user2.avatar;
    matchEntry.verdict = match.verdict;
    matchEntry.score1 = match.score1;
    matchEntry.score2 = match.score2;
    matchEntry.games = games.map((game) => {
      let verdict = (id === game.userId2) ? '2' : '0';
      verdict = (id === game.userId1) ? '1' : verdict;
      return {
        id: game.id,
        mapId: game.mapId,
        verdict,
      };
    });
    matchEntry.playedAt = (new Date(match.updatedAt)).toUTCString();
    matchData.push(matchEntry);
  }));

  return res.status(200).json({ type: 'Success', error: '', matchData });
});

router.get('/pro', async (req, res) => {
  const { id } = req.user;
  const proMatches = [];
  let proMatchesData = await Match.findAll({
    include: [
      { model: User, as: 'user1' },
      { model: User, as: 'user2' },
    ],
    where: {
      status: 'DONE',
    },
    order: [['interestingness', 'DESC'], ['createdAt', 'DESC']],
    limit: 10,
  });

  proMatchesData = parsify(proMatchesData);

  await Promise.all(proMatchesData.map(async (proMatch) => {
    const games = await Game.findAll({
      where: {
        matchId: proMatch.id,
      },
      attributes: ['id', 'mapId', 'status', 'verdict'],
    });

    const matchEntry = {};
    matchEntry.usedId1 = proMatch.user1.id;
    matchEntry.userId2 = proMatch.user2.id;
    matchEntry.username1 = proMatch.user1.username;
    matchEntry.username2 = proMatch.user2.username;
    matchEntry.avatar1 = proMatch.user1.avatar;
    matchEntry.avatar2 = proMatch.user2.avatar;
    matchEntry.verdict = proMatch.verdict;
    matchEntry.score1 = proMatch.score1;
    matchEntry.score2 = proMatch.score2;
    matchEntry.playedAt = (new Date(proMatch.updatedAt)).toUTCString();
    matchEntry.games = games.map((game) => {
      let verdict = (id === game.userId2) ? '2' : '0';
      verdict = (id === game.userId1) ? '1' : verdict;
      return {
        id: game.id,
        mapId: game.mapId,
        verdict,
      };
    });
    proMatches.push(matchEntry);
  }));

  return res.status(200).json({ type: 'Success', error: '', matchData: proMatches });
});

router.get('/log/:gameId', async (req, res) => {
  try {
    let { gameId } = req.params;
    const { id } = req.user;

    gameId = Number(gameId);
    const game = await Game.findOne({
      where: {
        id: gameId,
      },
    });

    if (!game) {
      return res.status(400).json({
        type: 'Error',
        error: 'Game does not exist',
      });
    }

    const matchLogDir = await constantUtils.getMatchLogDir();
    const player1Log = await git.getFile(null, game.debugLog1Path, null, matchLogDir);
    const player2Log = await git.getFile(null, game.debugLog2Path, null, matchLogDir);
    const gameLog = await git.getFile(null, game.log, null, matchLogDir);

    return res.status(200).json({
      type: 'Success',
      error: '',
      logs: {
        player1Log,
        player2Log,
        gameLog,
        matchPlayerId: ((id === game.userId1) ? 1 : 2),
      },
    });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

module.exports = router;
