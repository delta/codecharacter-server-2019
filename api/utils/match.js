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
    order: [
      ['createdAt', 'DESC'],
    ],
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

  const matchId = await createMatch(userId1, userId2);

  const username1 = await compileUtils.getUsername(userId1);
  const username2 = await compileUtils.getUsername(userId2);
  const storageDir = await constantUtils.getLeaderboardStorageDir();

  const user1DllPath = `${storageDir}/${username1}/dll1.cpp`;
  const user2DllPath = `${storageDir}/${username2}/dll2.cpp`;

  const mapIds = await mapUtils.getMapIds();

  await mapIds.forEach(async (mapId) => {
    const gameId = await gameUtils.createGame(
      userId1,
      userId2,
      matchId,
      mapId.id,
    );

    await executeUtils.pushToExecuteQueue(gameId, user1DllPath, user2DllPath);
    jobUtils.sendJob();
  });

  return {
    success: true,
    message: 'Match added to queue',
  };
};

const setMatchStatus = async (matchId, status) => {
  await Match.update({
    status,
  }, {
    where: { id: matchId },
  });
};

const updateMatchResults = async (matchId, score1, score2) => {
  const match = await Match.findOne({
    id: matchId,
  });

  const finalScore1 = match.score1 + score1;
  const finalScore2 = match.score2 + score2;

  match.score1 = finalScore1;
  match.score2 = finalScore2;

  await match.save();

  if (executeUtils.hasMatchEnded(matchId)) {
    await setMatchStatus(matchId, 'DONE');
  }
};

module.exports = {
  startMatch,
  updateMatchResults,
  setMatchStatus,
};
