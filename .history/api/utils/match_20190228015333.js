const EloRank = require('elo-rank');
const Match = require('../models').match;
const ExecuteQueue = require('../models').executequeue;
const Leaderboard = require('../models').leaderboard;
const Game = require('../models').game;
const userUtils = require('../utils/user');
const leaderboardUtils = require('./leaderboard');
const constantUtils = require('./constant');
const mapUtils = require('./map');
const gameUtils = require('./game');
const socket = require('./socketHandlers');
const notificationUtils = require('./notifications');

const elo = new EloRank(30);
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

// Declared here to avoid cyclic dependencies
const pushToExecuteQueue = async (gameId, userId1, userId2, dll1Path, dll2Path, mapId) => {
  try {
    const remainingJobs = await ExecuteQueue.count();
    const limit = await constantUtils.getExecuteQueueLimit();
    if (remainingJobs >= limit) {
      socket.sendMessage(userId1, 'Server is busy. Please try again later', 'Match Error');
      return false;
    }
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

const hasMatchEnded = async (matchId) => {
  const games = (await Game.findAll({
    where: { matchId },
  })).map(game => game.id);

  const executeQueueElement = await ExecuteQueue.findOne({
    where: { gameId: [...games] },
  });

  return (!executeQueueElement);
};

const createMatch = async (userId1, userId2) => {
  const match = await Match.create({
    userId1,
    userId2,
  });

  return match.id;
};

const startMatch = async (userId1, userId2) => {
  if (!(await checkMatchWaitTime(userId1))) {
    socket.sendMessage(userId1, 'Cannot initiate match. Too early', 'Match Error');
    return {
      success: false,
      message: 'Cannot initiate match. Too early',
    };
  }

  if (!(await leaderboardUtils.checkLeaderboardEntryExists(userId1))) {
    socket.sendMessage(userId1, 'You have not submitted any code yet', 'Match Error');
    return {
      success: false,
      message: 'You have not submitted any code yet',
    };
  }

  if (!(await leaderboardUtils.checkLeaderboardEntryExists(userId2))) {
    socket.sendMessage(userId1, 'Opponent has not submitted any code yet', 'Match Error');
    return {
      success: false,
      message: 'Opponent has not submitted any code yet',
    };
  }

  const matchId = await createMatch(userId1, userId2);
  const user1DllPath = 'dll1.dll';
  const user2DllPath = 'dll2.dll';

  const mapIds = await mapUtils.getMapIds();

  const gamePromises = mapIds.map(async (mapId) => {
    const gameId = await gameUtils.createGame(
      userId1,
      userId2,
      matchId,
      mapId,
    );

    await pushToExecuteQueue(
      gameId,
      userId1,
      userId2,
      user1DllPath,
      user2DllPath,
      mapId,
    );
  });

  await Promise.all(gamePromises);

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

const updateMatchResults = async (gameId, score1, score2, interestingness) => {
  try {
    const game = await Game.findOne({
      where: { id: gameId },
    });

    const matchId = game.matchId;

    const match = await Match.findOne({
      where: { id: matchId },
    });

    const finalScore1 = match.score1 + score1;
    const finalScore2 = match.score2 + score2;

    match.score1 = finalScore1;
    match.score2 = finalScore2;
    match.initialRating1 = await userUtils.getRating(match.userId1);
    match.initialRating2 = await userUtils.getRating(match.userId2);

    match.interestingness += interestingness;
    await match.save();

    if (await hasMatchEnded(matchId)) {
      await setMatchStatus(matchId, 'DONE');

      let user1Status;
      let user1Type;
      let user1Title;
      let user2Status;
      let user2Type;
      let user2Title;

      const user1 = await Leaderboard.findOne({ userId: match.userId1 });
      const user2 = await Leaderboard.findOne({ userId: match.userId2 });
      let rating1 = user1.rating;
      let rating2 = user2.rating;

      const expectedScore1 = elo.getExpected(rating1, rating2);
      const expectedScore2 = elo.getExpected(rating2, rating1);

      if (finalScore1 > finalScore2) {
        rating1 = elo.updateRating(expectedScore1, 1, rating1);
        rating2 = elo.updateRating(expectedScore2, 0, rating2);
        user1Status = `You won against ${match.userId2} \n ${finalScore1}-${finalScore2}`;
        user1Type = 'Match Result Success';
        user1Title = 'Victory';
        user2Status = `You lost against ${match.userId1} \n ${finalScore2}-${finalScore1}`;
        user2Type = 'Match Result Error';
        user2Title = 'Defeat';

        match.verdict = '1';
      } else if (finalScore2 > finalScore1) {
        rating1 = elo.updateRating(expectedScore1, 0, rating1);
        rating2 = elo.updateRating(expectedScore2, 1, rating2);
        user1Status = `You lost against ${await userUtils.getUsername(match.userId2)} \n ${finalScore1}-${finalScore2}`;
        user1Type = 'Match Result Error';
        user1Title = 'Defeat';
        user2Status = `You won against ${await userUtils.getUsername(match.userId1)} \n ${finalScore2}-${finalScore1}`;
        user2Type = 'Match Result Success';
        user2Title = 'Victory';

        match.verdict = '2';
      } else {
        rating1 = elo.updateRating(expectedScore1, 0, rating1);
        rating2 = elo.updateRating(expectedScore2, 0, rating2);
        user1Status = `You tied against ${await userUtils.getUsername(match.userId2)} \n ${finalScore1}-${finalScore2}`;
        user1Type = 'Match Result Success';
        user1Title = 'Draw';
        user2Status = `You tied against ${await userUtils.getUsername(match.userId1)} \n ${finalScore2}-${finalScore1}`;
        user2Type = 'Match Result Success';
        user2Title = 'Draw';

        match.verdict = '0';
      }
      await Leaderboard.update({
        rating: rating1,
      }, {
        where: {
          userId: match.userId1,
        },
      });

      await Leaderboard.update({
        rating: rating2,
      }, {
        where: {
          userId: match.userId2,
        },
      });

      match.finalRating1 = await userUtils.getRating(match.userId1);
      match.finalRating2 = await userUtils.getRating(match.userId2);
      await match.save();

      socket.sendMessage(match.userId1, user1Status, user1Type);
      socket.sendMessage(match.userId2, user2Status, user2Type);

      await notificationUtils.createNotification(user1Type, user1Title, user1Status, match.userId1);
      await notificationUtils.createNotification(user2Type, user2Title, user2Status, match.userId2);
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  startMatch,
  updateMatchResults,
  setMatchStatus,
  hasMatchEnded,
};
