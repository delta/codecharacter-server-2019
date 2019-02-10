const Match = require('../models').match;
const leaderboardUtils = require('./leaderboard');
const compileUtils = require('./compile');
const constantUtils = require('./constant');
const mapUtils = require('./map');
const gameUtils = require('./game');
const executeUtils = require('./execute');
const jobUtils = require('./job');

const checkMatchWaitTime = async (userId) => {
  const lastMatch = await Match.findOne({
    where: { userId1: userId },
    limit: 1,
  });

  if (!lastMatch) return true;

  const minMatchWaitTime = await constantUtils.minMatchWaitTime();

  const lastMatchTime = new Date(lastMatch.createdAt);
  const currentTime = new Date();

  if ((currentTime.getTime() - lastMatchTime.getTime()) < minMatchWaitTime) return false;

  return true;
};

const createMatch = async (userId1, userId2) => {
  const match = await Match.create({
    userId1,
    userId2,
  });

  return match.id;
};

const startMatch = async (userId1, userId2) => {
  if (!checkMatchWaitTime(userId1)) {
    return {
      success: false,
      message: 'Cannot initiate match. Too early',
    };
  }

  if (!leaderboardUtils.checkLeaderboardEntryExists(userId1)) {
    return {
      success: false,
      message: 'User 1 does not exist on leaderboard',
    };
  }

  if (!leaderboardUtils.checkLeaderboardEntryExists(userId2)) {
    return {
      success: false,
      message: 'User 2 does not exist on leaderboard',
    };
  }

  const matchId = createMatch(userId1, userId2);

  const username1 = compileUtils.getUsername(userId1);
  const username2 = compileUtils.getUsername(userId2);
  const storageDir = constantUtils.getLeaderboardStorageDir();

  const user1DllPath = `${storageDir}/${username1}/dll1.cpp`;
  const user2DllPath = `${storageDir}/${username2}/dll2.cpp`;

  const mapIds = mapUtils.getMapIds();

  await mapIds.forEach(async (mapId) => {
    const gameId = await gameUtils.createGame({
      userId1,
      userId2,
      matchId,
      mapId,
    });

    await executeUtils.pushToExecuteQueue(gameId, user1DllPath, user2DllPath);
    jobUtils.sendJob();
  });

  return {
    success: true,
    message: 'Match added to queue',
  };
};

module.exports = {
  startMatch,
};
