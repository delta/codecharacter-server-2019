const rp = require('request-promise');
const ExecuteQueue = require('../models').executequeue;
const compileBoxUtils = require('./compileBox');
const gameUtils = require('./game');
const User = require('../models').user;
const Game = require('../models').game;
const git = require('./gitHandlers');
const { secretString } = require('../config/config');
const { getMap } = require('./map');

const getUsername = async (userId) => {
  try {
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (user) return user.username;
    return '';
  } catch (err) {
    return '';
  }
};

const pushToExecuteQueue = async (gameId, dll1Path, dll2Path) => {
  try {
    const game = await Game.findOne({ where: { id: gameId } });
    const {
      userId1,
      userId2,
    } = game;
    await ExecuteQueue.create({
      userId1,
      userId2,
      gameId,
      dll1Path,
      dll2Path,
      status: 'QUEUED',
    });
    return true;
  } catch (err) {
    return false;
  }
};

const setExecuteQueueJobStatus = async (queueId, status) => ExecuteQueue.update({
  status,
}, {
  where: { id: queueId },
});

const getOldestExecuteJob = async () => {
  const executeJob = await ExecuteQueue.findOne({
    order: [
      ['createdAt', 'ASC'],
    ],
    limit: 1,
  });
  return executeJob;
};

const sendExecuteJob = async (gameId, compileBoxId) => {
  try {
    if (await compileBoxUtils.getStatus(compileBoxId) === 'BUSY') {
      return {
        type: 'Error',
        error: 'CompileBox not available',
      };
    }

    await gameUtils.setGameStatus(gameId, 'Compiling');
    await compileBoxUtils.changeCompileBoxState(compileBoxId, 'BUSY');
    const game = await Game.findOne({ where: { id: gameId } });
    const { userId1, userId2, mapId } = game;

    const dll1 = await git.getFile(await getUsername(userId1), 'dll1.dll');
    const dll2 = await git.getFile(await getUsername(userId2), 'dll2.dll');
    const map = await getMap(mapId);
    const targetCompileBoxUrl = await compileBoxUtils.getUrl(compileBoxId);

    const options = {
      method: 'POST',
      uri: `${targetCompileBoxUrl}/execute`,
      body: {
        dll1,
        dll2,
        map,
        secretString,
        gameId,
      },
      json: true,
    };

    const response = await rp(options);
    // await compileBoxUtils.changeCompileBoxState(compileBoxId, 'IDLE');
    // this is to be done later when match result are sent via post request

    const { success } = response;

    if (success) {
      return true;
    }
    return false;
  } catch (error) {
    // sendMessage(userId, 'Internal Server Error', 'Compilation Error');
    return {
      type: 'Error',
      error: 'Internal Server Error',
    };
  }
};

module.exports = {
  pushToExecuteQueue,
  sendExecuteJob,
  getUsername,
  getOldestExecuteJob,
  setExecuteQueueJobStatus,
};
