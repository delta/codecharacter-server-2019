const rp = require('request-promise');

const { Op } = require('sequelize');
const ExecuteQueue = require('../models').executequeue;
const Ai = require('../models').ai;
const compileBoxUtils = require('./compileBox');
const gameUtils = require('./game');
const constantUtils = require('./constant');
const socket = require('./socketHandlers');
const { getUsername } = require('./user');
const git = require('./gitHandlers');
const userUtils = require('./user');
const { secretString } = require('../config/config');
const { getMap } = require('./map');

const getAiName = async (aiId) => {
  const ai = await Ai.findOne({
    where: { id: aiId },
  });

  if (!ai) return '';

  return ai.name;
};

const executeQueueSize = async () => ExecuteQueue.count();

const userAlreadyInQueue = async (userId) => {
  const matchEntry = await ExecuteQueue.findOne({
    where: {
      [Op.or]: [{ userId1: userId }, { userId2: userId }],
      [Op.or]: [{ type: 'SELF_MATCH' }, { type: 'PREVIOUS_COMMIT_MATCH' }],
    },
  });

  return (!!matchEntry);
};

const checkAiExists = async (aiId) => {
  const ai = await Ai.findOne({
    where: { id: aiId },
  });

  return (!!ai);
};

const pushAiMatchToQueue = async (userId, aiId, mapId) => {
  try {
    if (await userAlreadyInQueue(userId)) {
      socket.sendMessage(userId, 'Please wait for your previous match to complete', 'Match Error');
      return false;
    }

    const queueSize = await executeQueueSize();
    const limit = await constantUtils.getExecuteQueueLimit();

    if (queueSize >= limit) {
      socket.sendMessage(userId, 'Server is currently busy. Please try again later.', 'Match Error');
      return false;
    }

    if (!(await checkAiExists(aiId))) {
      socket.sendMessage(userId, 'Ai does not exist.', 'Match Error');
      return false;
    }

    await ExecuteQueue.create({
      userId1: userId,
      userId2: userId,
      gameId: null,
      dll1Path: 'dll1.dll',
      dll2Path: 'dll2.dll',
      status: 'QUEUED',
      type: 'AI_MATCH',
      mapId,
      aiId,
    });

    socket.sendMessage(userId, 'Added AI match to queue', 'Match Info');

    return true;
  } catch (err) {
    socket.sendMessage(userId, 'Internal Server Error', 'Match Error');
    return false;
  }
};

const pushSelfMatchToQueue = async (userId, mapId) => {
  try {
    if (await userAlreadyInQueue(userId)) {
      socket.sendMessage(userId, 'Please wait for your previous match to complete', 'Match Error');
      return false;
    }

    const queueSize = await executeQueueSize();
    const limit = await constantUtils.getExecuteQueueLimit();

    if (queueSize >= limit) {
      socket.sendMessage(userId, 'Server is currently busy. Please try again later.', 'Match Error');
      return false;
    }

    await ExecuteQueue.create({
      userId1: userId,
      userId2: userId,
      gameId: null,
      dll1Path: 'dll1.dll',
      dll2Path: 'dll2.dll',
      status: 'QUEUED',
      type: 'SELF_MATCH',
      mapId,
    });

    socket.sendMessage(userId, 'Added self match to queue', 'Match Info');

    return true;
  } catch (err) {
    socket.sendMessage(userId, 'Internal Server Error', 'Match Error');
    return false;
  }
};

const pushCommitMatchToQueue = async (userId, mapId) => {
  try {
    if (await userAlreadyInQueue(userId)) {
      socket.sendMessage(userId, 'Please wait for your previous match to complete', 'Match Error');
      return false;
    }

    const queueSize = await executeQueueSize();
    const limit = await constantUtils.getExecuteQueueLimit();

    if (queueSize >= limit) {
      socket.sendMessage(userId, 'Server is currently busy. Please try again later.', 'Match Error');
      return false;
    }

    await ExecuteQueue.create({
      userId1: userId,
      userId2: userId,
      gameId: null,
      dll1Path: 'dll1.dll',
      dll2Path: 'dll2_previous_commit.dll',
      status: 'QUEUED',
      type: 'PREVIOUS_COMMIT_MATCH',
      mapId,
    });
    socket.sendMessage(userId, 'Added previous commit match to queue', 'Match Info');

    return true;
  } catch (err) {
    socket.sendMessage(userId, 'Internal Server Error', 'Match Error');
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

const parseResults = ({ scores, interestingness, winType }) => {
  const player1Score = Number(scores[0].score);
  const player2Score = Number(scores[1].score);
  const player1Status = scores[0].status;
  const player2Status = scores[1].status;

  return {
    player1Score,
    player2Score,
    player1Status,
    player2Status,
    interestingness: Number(interestingness),
    winType,
  };
};


const sendExecuteJob = async (
  gameId,
  compileBoxId,
  userId1,
  userId2,
  aiId,
  mapId,
  matchType,
  dll1Path,
  dll2Path,
) => {
  try {
    if (await compileBoxUtils.getCompileBoxStatus(compileBoxId) === 'BUSY') {
      return {
        type: 'Error',
        error: 'CompileBox not available',
      };
    }

    if (matchType === 'USER_MATCH') {
      socket.sendMessage(userId1, `Match against ${await userUtils.getUsername(userId2)} is executing.`, 'Match Info');
    } else if (matchType === 'SELF_MATCH') {
      socket.sendMessage(userId1, `Match against ${await userUtils.getUsername(userId2)} is executing.`, 'Match Info');
    } else if (matchType === 'AI_MATCH') {
      socket.sendMessage(userId1, `Match against AI ${aiId} is executing.`, 'Match Info');
    } else if (matchType === 'PREVIOUS_COMMIT_MATCH') {
      socket.sendMessage(userId1, 'Match against previous commit is executing.', 'Match Info');
    }

    if (matchType === 'USER_MATCH') {
      await gameUtils.setGameStatus(gameId, 'Executing');
      await compileBoxUtils.changeCompileBoxState(compileBoxId, 'BUSY');
    }

    let dll1Dir;
    let dll2Dir;

    const username1 = await getUsername(userId1);
    const username2 = await getUsername(userId2);

    if (matchType === 'SELF_MATCH' || matchType === 'PREVIOUS_COMMIT_MATCH') {
      const codeStorageDir = await constantUtils.getCodeStorageDir();
      dll1Dir = `${codeStorageDir}/${username1}`;
      dll2Dir = `${codeStorageDir}/${username2}`;
    } else if (matchType === 'USER_MATCH') {
      const leaderboardStorageDir = await constantUtils.getLeaderboardStorageDir();
      dll1Dir = `${leaderboardStorageDir}/${await getUsername(userId1)}`;
      dll2Dir = `${leaderboardStorageDir}/${await getUsername(userId2)}`;
    } else if (matchType === 'AI_MATCH') {
      const aiStorageDir = await constantUtils.getAiStorageDir();
      const codeStorageDir = await constantUtils.getCodeStorageDir();
      dll1Dir = `${codeStorageDir}/${await getUsername(userId1)}`;
      dll2Dir = `${aiStorageDir}/${await await getAiName(aiId)}`;
    }

    if (!(await git.checkFileExists(`${dll2Dir}/${dll2Path}`))) {
      return false;
    }

    const dll1 = JSON.parse(await git.getFile('', dll1Path, null, dll1Dir));
    const dll2 = JSON.parse(await git.getFile('', dll2Path, null, dll2Dir));
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
        matchId: gameId,
      },
      json: true,
    };

    const response = await rp(options);
    await compileBoxUtils.changeCompileBoxState(compileBoxId, 'IDLE');

    if (response.errorType === 'PLAYER_RUNTIME_ERROR') {
      socket.sendMessage(userId1, 'Runtime error', 'Match Error');
      return {
        success: false,
        popFromQueue: true,
      };
    } if (['EXECUTE_PROCESS_ERROR', 'UNKNOWN_EXECUTE_ERROR', 'KEY_MISMATCH'].includes(response.errorType)) {
      console.log(gameId, response.error);
      socket.sendMessage(userId1, 'Internal server error', 'Match Error');
      return {
        success: false,
        popFromQueue: true,
      };
    } if (response.errorType === 'BOX_BUSY') {
      return {
        success: false,
        popFromQueue: false,
      };
    }
    const results = parseResults(response.results);

    const {
      matchId,
      score1,
      score2,
      status1,
    } = await gameUtils.updateGameResults(gameId, results);

    if (matchType === 'USER_MATCH') {
      await gameUtils.updateGameLogs(
        gameId,
        response.player1LogCompressed,
        response.player2LogCompressed,
        response.log,
      );

      return {
        success: true,
        popFromQueue: true,
        matchId,
        score1,
        score2,
        interestingness: results.interestingness,
      };
    }

    if (status1 === 'RUNTIME_ERROR') {
      socket.sendMessage('Your match threw a runtime error', 'Match Error');
    } else if (status1 === 'EXCEEDED_INSTRUCTION_LIMIT') {
      socket.sendMessage('Your code exceeded the instruction limit', 'Match Error');
    } else if (status1 === 'UNDEFINED') {
      socket.sendMessage('Something went wrong...', 'Match Error');
    } else if (status1 === 'TIMEOUT') {
      socket.sendMessage('Your code took too long to execute', 'Match Error');
    } else {
      socket.sendMessage(userId1, JSON.stringify({
        player1Log: response.player1LogCompressed,
        player2Log: response.player2LogCompressed,
        gameLog: response.log,
        results,
      }), 'Match Success');
    }
    return {
      success: true,
      popFromQueue: true,
    };
  } catch (error) {
    return {
      success: false,
      popFromQueue: true,
    };
  }
};

module.exports = {
  sendExecuteJob,
  getUsername,
  getOldestExecuteJob,
  setExecuteQueueJobStatus,
  pushSelfMatchToQueue,
  pushCommitMatchToQueue,
  pushAiMatchToQueue,
  executeQueueSize,
};
