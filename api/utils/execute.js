const rp = require('request-promise');
const ExecuteQueue = require('../models').executequeue;
const compileBoxUtils = require('./compileBox');
const gameUtils = require('./game');
const constantUtils = require('./constant');
const socket = require('./socketHandlers');
const Match = require('../models').match;
const User = require('../models').user;
const git = require('./gitHandlers');
const { secretString } = require('../config/config');
const { getMap } = require('./map');

// Redeclaring to avoid cyclic dependencies
const setMatchStatus = async (matchId, status) => {
  await Match.update({
    status,
  }, {
    where: { id: matchId },
  });
};

// Redeclaring to avoid cyclic dependencies
const hasMatchEnded = async (matchId) => {
  const executeQueueElement = await ExecuteQueue.findOne({
    where: { matchId },
  });

  return (!executeQueueElement);
};

// Redeclaring to avoid cyclic dependencies
const updateMatchResults = async (matchId, score1, score2) => {
  const match = await Match.findOne({
    id: matchId,
  });

  const finalScore1 = match.score1 + score1;
  const finalScore2 = match.score2 + score2;

  match.score1 = finalScore1;
  match.score2 = finalScore2;

  await match.save();

  if (await hasMatchEnded(matchId)) {
    await setMatchStatus(matchId, 'DONE');
    if (finalScore1 > finalScore2) {
      socket.sendMessage(match.userId1, `You won against ${match.userId2} \n ${finalScore1}-${finalScore2}`, 'Success');
      socket.sendMessage(match.userId2, `You lost against ${match.userId1} \n ${finalScore2}-${finalScore1}`, 'Error');
    } else if (finalScore2 > finalScore1) {
      socket.sendMessage(match.userId1, `You lost against ${match.userId2} \n ${finalScore1}-${finalScore2}`, 'Error');
      socket.sendMessage(match.userId2, `You won against ${match.userId1} \n ${finalScore2}-${finalScore1}`, 'Success');
    } else {
      socket.sendMessage(match.userId1, `You tied against ${match.userId2} \n ${finalScore1}-${finalScore2}`, 'Success');
      socket.sendMessage(match.userId2, `You tied against ${match.userId1} \n ${finalScore2}-${finalScore1}`, 'Success');
    }
  }
};

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

const startSelfMatch = async (userId, mapId) => {
  try {
    await ExecuteQueue.create({
      userId1: userId,
      userId2: userId,
      gameId: null,
      dll1Path: 'dll1.dll',
      dll2Path: 'dll2.dll',
      status: 'QUEUED',
      isSelf: true,
      mapId,
    });

    return true;
  } catch (err) {
    return false;
  }
};

const pushToExecuteQueue = async (gameId, userId1, userId2, dll1Path, dll2Path, mapId) => {
  try {
    await ExecuteQueue.create({
      userId1,
      userId2,
      gameId,
      dll1Path,
      dll2Path,
      status: 'QUEUED',
      isSelf: false,
      mapId,
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

const sendExecuteJob = async (gameId, compileBoxId, userId1, userId2, mapId, isSelf) => {
  try {
    if (await compileBoxUtils.getStatus(compileBoxId) === 'BUSY') {
      return {
        type: 'Error',
        error: 'CompileBox not available',
      };
    }

    if (!isSelf) {
      await gameUtils.setGameStatus(gameId, 'Compiling');
      await compileBoxUtils.changeCompileBoxState(compileBoxId, 'BUSY');
    }

    let dll1Dir;
    let dll2Dir;

    const username1 = await getUsername(userId1);
    const username2 = await getUsername(userId2);

    if (isSelf) {
      const codeStorageDir = await constantUtils.getCodeStorageDir();
      dll1Dir = `${codeStorageDir}/${username1}`;
      dll2Dir = `${codeStorageDir}/${username2}`;
    } else {
      const leaderboardStorageDir = await constantUtils.getLeaderboardStorageDir();
      dll1Dir = `${leaderboardStorageDir}/${await getUsername(userId1)}`;
      dll2Dir = `${leaderboardStorageDir}/${await getUsername(userId2)}`;
    }

    const dll1 = JSON.parse(await git.getFile('', 'dll1.dll', null, dll1Dir));
    const dll2 = JSON.parse(await git.getFile('', 'dll2.dll', null, dll2Dir));
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
      socket.sendMessage(userId1, (response.err).toString(), 'Error');
      return false;
    }

    const results = parseResults(response.results);

    if (!isSelf) {
      const { matchId, score1, score2 } = await gameUtils.updateGameResults(gameId, results);

      await updateMatchResults(matchId, score1, score2);
      await gameUtils.updateGameLogs(
        gameId,
        response.player1LogCompressed,
        response.player2LogCompressed,
        response.log,
      );
    } else {
      socket.sendMessage(userId1, JSON.stringify({
        player1Log: response.player1LogCompressed,
        player2Log: response.player2LogCompressed,
        gameLog: response.log,
        results,
      }), 'Match Logs');
    }

    return true;
  } catch (error) {
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
  hasMatchEnded,
  startSelfMatch,
};
