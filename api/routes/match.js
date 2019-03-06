const express = require('express');
const { Op } = require('sequelize');

const Map = require('../models').map;
const Match = require('../models').match;
const Game = require('../models').game;
const Leaderboard = require('../models').leaderboard;
const User = require('../models').user;

const git = require('../utils/gitHandlers');
const socket = require('../utils/socketHandlers');
const constantUtils = require('../utils/constant');
const userUtils = require('../utils/user');

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
      attributes: ['id', 'mapId', 'status', 'verdict', 'userId1', 'userId2', 'winType'],
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

      return {
        id: game.id,
        mapId: game.mapId,
        winType: game.winType,
        verdict,
      };
    });
    matchEntry.playedAt = (new Date(match.updatedAt)).toUTCString();
    matchData.push(matchEntry);
  }));

  return res.status(200).json({ type: 'Success', error: '', matchData });
});

router.get('/pro', async (req, res) => {
  try {
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
      limit: 5,
    });

    proMatchesData = parsify(proMatchesData);

    await Promise.all(proMatchesData.map(async (proMatch) => {
      const games = await Game.findAll({
        where: {
          matchId: proMatch.id,
        },
        order: ['mapId'],
        attributes: ['id', 'mapId', 'winType', 'status', 'verdict', 'userId1', 'userId2'],
      });

      let matchVerdict = '0';

      if (proMatch.verdict === '1') {
        if (proMatch.userId1 === id) matchVerdict = '1';
        else if (proMatch.userId2 === id) matchVerdict = '2';
      } else if (proMatch.verdict === '2') {
        if (proMatch.userId1 === id) matchVerdict = '2';
        else if (proMatch.userId2 === id) matchVerdict = '1';
      }

      const leaderboard1User = await Leaderboard.findOne({
        where: {
          userId: proMatch.user1.id,
        },
      });

      const leaderboard2User = await Leaderboard.findOne({
        where: {
          userId: proMatch.user2.id,
        },
      });

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
      matchEntry.rating1 = leaderboard1User.rating;
      matchEntry.rating2 = leaderboard2User.rating;
      matchEntry.playedAt = (new Date(proMatch.updatedAt)).toUTCString();
      matchEntry.games = games.map(game => ({
        id: game.id,
        mapId: game.mapId,
        winType: game.winType,
        verdict: game.verdict,
      }));
      proMatches.push(matchEntry);
    }));

    return res.status(200).json({ type: 'Success', error: '', matchData: proMatches });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
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

    const username1 = await userUtils.getUsername(game.userId1);
    const username2 = await userUtils.getUsername(game.userId2);

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

    let errorMessage = '';

    if (game.status1 === 'RUNTIME_ERROR') {
      errorMessage = `${errorMessage}${username1}'s code threw a runtime error.\n`;
    } else if (game.status1 === 'EXCEEDED_INSTRUCTION') {
      errorMessage = `${errorMessage}${username1}'s code exceeded the instruction limit.\n`;
    } else if (game.status1 === 'TIMEOUT') {
      errorMessage = `${errorMessage}${username1}'s code is an error.\n`;
    } else if (game.status1 === 'UNDEFINED') {
      errorMessage = `${errorMessage}Something went wrong...\n`;
    }

    if (errorMessage === '' && game.status2 === 'RUNTIME_ERROR') {
      errorMessage = `${errorMessage}${username2}'s code threw a runtime error.\n`;
    } else if (errorMessage === '' && game.status2 === 'EXCEEDED_INSTRUCTION') {
      errorMessage = `${errorMessage}${username2}'s code exceeded the instruction limit.\n`;
    } else if (errorMessage === '' && game.status2 === 'TIMEOUT') {
      errorMessage = `${errorMessage}${username2}'s code is an error.\n`;
    } else if (errorMessage === '' && game.status2 === 'UNDEFINED') {
      errorMessage = `${errorMessage}Something went wrong...\n`;
    }

    if (errorMessage !== '') {
      socket.sendMessage(id, errorMessage, 'Match Error');
      return res.status(200).json({
        type: 'Success',
        error: '',
        logs: {
          player1Log: '',
          player2Log: '',
          gameLog: '',
          // eslint-disable-next-line
          matchPlayerId: ((id === game.userId1) ? 1 : ((id === game.userId2) ? 2 : 1)),
        },
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
    console.log(err);
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

module.exports = router;
