const express = require('express');
const { Op } = require('sequelize');

const Map = require('../models').map;
const Match = require('../models').match;
const Game = require('../models').game;
const User = require('../models').user;

const git = require('../utils/gitHandlers');
const socket = require('../utils/socketHandlers');
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
      order: ['mapId'],
      attributes: ['id', 'mapId', 'status', 'verdict', 'userId1', 'userId2'],
    });

    let matchVerdict = '0';

    if (match.verdict === '1') {
      if (match.userId1 === id) matchVerdict = '1';
      else if (match.userId2 === id) matchVerdict = '2';
    } else if (match.verdict === '2') {
      if (match.userId1 === id) matchVerdict = '2';
      else if (match.userId2 === id) matchVerdict = '1';
    }
    const matchEntry = {};
    matchEntry.usedId1 = match.user1.id;
    matchEntry.userId2 = match.user2.id;
    matchEntry.username1 = match.user1.username;
    matchEntry.username2 = match.user2.username;
    matchEntry.avatar1 = match.user1.avatar;
    matchEntry.avatar2 = match.user2.avatar;
    matchEntry.verdict = matchVerdict;
    matchEntry.score1 = match.score1;
    matchEntry.score2 = match.score2;
    matchEntry.games = games.map((game) => {
      let verdict = '0';

      if (game.verdict === '1') {
        if (id === game.userId1) verdict = '1';
        else if (id === game.userId2) verdict = '2';
      } else if (game.verdict === '2') {
        if (id === game.userId1) verdict = '2';
        else if (id === game.userId2) verdict = '1';
      }

      if (game.status === 'Error') {
        verdict = '3';
      }


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
      include: [
        { model: User, as: 'user1' },
        { model: User, as: 'user2' },
      ],
      where: {
        matchId: proMatch.id,
      },
      order: ['mapId'],
      attributes: ['id', 'mapId', 'status', 'verdict', 'userId1', 'userId2'],
    });

    let matchVerdict = '0';

    if (proMatch.verdict === '1') {
      if (proMatch.userId1 === id) matchVerdict = '1';
      else if (proMatch.userId2 === id) matchVerdict = '2';
    } else if (proMatch.verdict === '2') {
      if (proMatch.userId1 === id) matchVerdict = '2';
      else if (proMatch.userId2 === id) matchVerdict = '1';
    }

    const matchEntry = {};
    matchEntry.usedId1 = proMatch.user1.id;
    matchEntry.userId2 = proMatch.user2.id;
    matchEntry.username1 = proMatch.user1.username;
    matchEntry.username2 = proMatch.user2.username;
    matchEntry.avatar1 = proMatch.user1.avatar;
    matchEntry.avatar2 = proMatch.user2.avatar;
    matchEntry.verdict = matchVerdict;
    matchEntry.score1 = proMatch.score1;
    matchEntry.score2 = proMatch.score2;
    matchEntry.playedAt = (new Date(proMatch.updatedAt)).toUTCString();
    matchEntry.games = games.map((game) => {
      const verdict = '0';

      if (game.status === 'Error') {
        verdict = '3';
      }

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

    const map = await Map.findOne({
      where: {
        id: game.mapId,
      },
    });

    if (map.isHidden) {
      socket.sendMessage(id, `${map.name} is a mystery map.`, 'Error');
    }

    if (!game || map.isHidden) {
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
