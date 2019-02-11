const rp = require('request-promise');
const ExecuteQueue = require('../models').executequeue;
const compileBoxUtils = require('./compileBox');
const gameUtils = require('./game');
const socket = require('./socketHandlers');
const Match = require('../models').match;
const User = require('../models').user;
const Game = require('../models').game;
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

  let user1Status;
  let user1Type;
  let user2Status;
  let user2Type;

  if (await hasMatchEnded(matchId)) {
    await setMatchStatus(matchId, 'DONE');
    if (finalScore1 > finalScore2) {
      user1Status = `You won against ${match.userId2} \n ${finalScore1}-${finalScore2}`;
      user1Type = 'Success';
      user2Status = `You lost against ${match.userId1} \n ${finalScore2}-${finalScore1}`;
      user2Type = 'Error';
    } else if (finalScore2 > finalScore1) {
      user1Status = `You lost against ${match.userId2} \n ${finalScore1}-${finalScore2}`;
      user1Type = 'Error';
      user2Status = `You won against ${match.userId1} \n ${finalScore2}-${finalScore1}`;
      user2Type = 'Success';
    } else {
      user1Status = `You tied against ${match.userId2} \n ${finalScore1}-${finalScore2}`;
      user1Type = 'Success';
      user2Status = `You tied against ${match.userId1} \n ${finalScore2}-${finalScore1}`;
      user2Type = 'Success';
    }
  }

  socket.sendMessage(match.userId1, user1Status, user1Type);
  socket.sendMessage(match.userId2, user2Status, user2Type);
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

    const dll1 = JSON.parse(await git.getFile('', 'dll1.dll', null, `${appPath}/storage/leaderboard/${await getUsername(userId1)}`));
    const dll2 = JSON.parse(await git.getFile('', 'dll2.dll', null, `${appPath}/storage/leaderboard/${await getUsername(userId2)}`));
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

    const { matchId, score1, score2 } = await gameUtils.updateGameResults(gameId, results);

    await updateMatchResults(matchId, score1, score2);
    await gameUtils.updateGameLogs(
      gameId,
      response.player1LogCompressed,
      response.player2LogCompressed,
      response.log,
    );

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
};
