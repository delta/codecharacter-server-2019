const shell = require('shelljs');
const randomstring = require('randomstring');
const Game = require('../models').game;
const constantUtils = require('./constant');
const git = require('./gitHandlers');

const createGame = async (userId1, userId2, matchId, mapId) => {
  const debugLog1Path = `${randomstring.generate()}.log`;
  const debugLog2Path = `${randomstring.generate()}.log`;
  const logPath = `${randomstring.generate()}.log`;
  const logStorageDir = await constantUtils.getMatchLogDir();

  await shell.touch(`${logStorageDir}/${debugLog1Path}`);
  await shell.touch(`${logStorageDir}/${debugLog2Path}`);
  await shell.touch(`${logStorageDir}/${logPath}`);
  const game = await Game.create({
    userId1,
    userId2,
    matchId,
    debugLog1Path,
    debugLog2Path,
    log: logPath,
    status: 'Waiting',
    mapId,
    points1: 0,
    points2: 0,
  });

  return game.id;
};

const updateGameLogs = async (
  gameId,
  debugLog1,
  debugLog2,
  log) => {
  const game = await Game.findOne({
    where: { id: gameId },
  });

  if (!game) return;

  const logStorageDir = await constantUtils.getMatchLogDir();

  await git.setFile('', game.debugLog1Path, JSON.stringify(debugLog1), logStorageDir);
  await git.setFile('', game.debugLog2Path, JSON.stringify(debugLog2), logStorageDir);
  await git.setFile('', game.log, JSON.stringify(log), logStorageDir);
};

const setGameStatus = async (gameId, status) => {
  await Game.update({
    status,
  }, {
    where: { id: gameId },
  });
};

const getMatchLogs = async (gameId) => {
  const game = Game.findOne({
    where: { id: gameId },
  });

  const matchLogBaseDir = constantUtils.getMatchLogDir();

  const debugLog1 = await git.getFile('', game.debugLog1Path, null, matchLogBaseDir);
  const debugLog2 = await git.getFile('', game.debugLog2Path, null, matchLogBaseDir);
  const log = await git.getFile('', game.log, null, matchLogBaseDir);

  return { debugLog1, debugLog2, log };
};

const updateGameResults = async (gameId, results) => {
  const game = await Game.findOne({
    where: { id: gameId },
  });

  let score1 = 0;
  let score2 = 0;

  if (results.score1 > results.score2) {
    game.verdict = '1';
    score1 += 1;
  } else if (results.score2 > results.score1) {
    game.verdict = '2';
    score2 += 1;
  } else {
    game.verdict = '0';
  }

  game.points1 = results.player1Score;
  game.points2 = results.player2Score;
  game.interestingness += results.interestingness;

  game.status = 'Executed';

  const { matchId } = game;
  await game.save();

  return {
    matchId,
    score1,
    score2,
  };
};

module.exports = {
  createGame,
  updateGameLogs,
  setGameStatus,
  getMatchLogs,
  updateGameResults,
};
