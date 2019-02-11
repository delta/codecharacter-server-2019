const rp = require('request-promise');

const ExecuteQueue = require('../models').executequeue;
const compileBoxUtils = require('./compileBox');
const gameUtils = require('./game');
const constantUtils = require('./constant');
const socket = require('./socketHandlers');
const { getUsername } = require('./user');
const git = require('./gitHandlers');
const matchUtils = require('./match');
const { secretString } = require('../config/config');
const { getMap } = require('./map');

const pushSelfMatchToQueue = async (userId, mapId) => {
  try {
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

    socket.sendMessage(userId, 'Added self match to queue', 'Self Match Info');

    return true;
  } catch (err) {
    socket.sendMessage(userId, 'Something went wrong', 'Self Match Error');
    return false;
  }
};

const pushCommitMatchToQueue = async (userId, mapId) => {
  try {
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

    socket.sendMessage(userId, 'Added self match to queue', 'Self Match Info');

    return true;
  } catch (err) {
    socket.sendMessage(userId, 'Something went wrong', 'Self Match Error');
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

const parseResults = (resultString) => {
  const splitValues = resultString.split(' ');
  const player1Score = Number(splitValues[1]);
  const player1Status = splitValues[2];
  const player2Score = Number(splitValues[3]);
  const player2Status = splitValues[4];

  return {
    player1Score,
    player2Score,
    player1Status,
    player2Status,
  };
};

const sendExecuteJob = async (
  gameId,
  compileBoxId,
  userId1,
  userId2,
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
      socket.sendMessage(userId1, `Match against ${userId2} is executing.`, 'Match Info');
    } else if (matchType === 'SELF_MATCH') {
      socket.sendMessage(userId1, `Match against ${userId2} is executing.`, 'Self Match Info');
    }

    if (matchType === 'USER_MATCH') {
      await gameUtils.setGameStatus(gameId, 'Compiling');
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
    }

    if (matchType === 'PREVIOUS_COMMIT_HASH') {
      if (!(await git.checkFileExists(`${dll2Dir}/${dll2Path}`))) {
        return false;
      }
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

    if (!response.success) {
      if (matchType === 'SELF_MATCH') {
        socket.sendMessage(userId1, (response.err).toString(), 'Self Match Error');
      } else if (matchType === 'USER_MATCH') {
        socket.sendMessage(userId1, (response.err).toString(), 'Match Error');
      }

      return false;
    }

    const results = parseResults(response.results);

    if (matchType === 'USER_MATCH') {
      const { matchId, score1, score2 } = await gameUtils.updateGameResults(gameId, results);

      await matchUtils.updateMatchResults(matchId, score1, score2);
      await gameUtils.updateGameLogs(
        gameId,
        response.player1LogCompressed,
        response.player2LogCompressed,
        response.log,
      );
    } else if (matchType === 'SELF_MATCH' || matchType === 'PREVIOUS_COMMIT_MATCH') {
      socket.sendMessage(userId1, JSON.stringify({
        player1Log: response.player1LogCompressed,
        player2Log: response.player2LogCompressed,
        gameLog: response.log,
        results,
      }), 'Self Match Result');
    }

    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  sendExecuteJob,
  getUsername,
  getOldestExecuteJob,
  setExecuteQueueJobStatus,
  pushSelfMatchToQueue,
  pushCommitMatchToQueue,
};
