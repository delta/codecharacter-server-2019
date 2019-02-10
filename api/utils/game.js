const randomstring = require('randomstring');
const Game = require('../models').game;
const constantUtils = require('./constant');
const git = require('./gitHandlers');

const createGame = async (userId1, userId2, matchId, mapId) => {
  const debugLog1Path = `${randomstring.generate()}.log`;
  const debugLog2Path = `${randomstring.generate()}.log`;
  const logPath = `${randomstring.generate()}.log`;

  const game = await Game.create({
    userId1,
    userId2,
    matchId,
    debugLog1Path,
    debugLog2Path,
    log: logPath,
    status: 'Waiting',
    mapId,
  });

  return game.id;
};

const updateGameLogs = async (
  gameId,
  debugLog1Path,
  debugLog2Path,
  logPath,
  debugLog1,
  debugLog2,
  log) => {
  const game = await Game.findOne({
    where: { id: gameId },
  });

  if (!game) return;

  const logStorageDir = constantUtils.getLeaderboardStorageDir();

  await git.setFile('', debugLog1Path, JSON.stringify(debugLog1), logStorageDir);
  await git.setFile('', debugLog2Path, JSON.stringify(debugLog2), logStorageDir);
  await git.setFile('', logPath, JSON.stringify(log), logStorageDir);
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

module.exports = {
  createGame,
  updateGameLogs,
  setGameStatus,
  getMatchLogs,
};
