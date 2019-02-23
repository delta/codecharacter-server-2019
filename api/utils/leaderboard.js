const shell = require('shelljs');
const { Op } = require('sequelize');
const Leaderboard = require('../models').leaderboard;
const Constant = require('../models').constant;
const Match = require('../models').match;
const git = require('./gitHandlers');

const createLeaderboardUserFolder = async (userDir) => {
  await shell.mkdir(userDir);
  await shell.touch(`${userDir}/dll1.dll`);
  await shell.touch(`${userDir}/dll2.dll`);
};

const updateLeaderboard = async (username) => {
  const dll1 = await git.getFile(username, 'dll1.dll');
  const dll2 = await git.getFile(username, 'dll2.dll');

  const leaderboardStorageDir = (await Constant.findOne({
    where: {
      key: 'DEFAULT_LEADERBOARD_STORAGE_DIR',
    },
  })).value;

  await git.setFile(username, 'dll1.dll', dll1, `${leaderboardStorageDir}/${username}`);
  await git.setFile(username, 'dll2.dll', dll2, `${leaderboardStorageDir}/${username}`);
};

const createLeaderboardEntry = async (userId, username) => {
  const initialRating = Number((await Constant.findOne({
    where: {
      key: 'INITIAL_RATING',
    },
  })).value);

  const leaderboardStorageDir = (await Constant.findOne({
    where: {
      key: 'DEFAULT_LEADERBOARD_STORAGE_DIR',
    },
  })).value;

  const leaderboardUserDir = `${leaderboardStorageDir}/${username}`;
  await Leaderboard.create({
    userId,
    rating: initialRating,
    dll1: `${leaderboardUserDir}/dll1.dll`,
    dll2: `${leaderboardUserDir}/dll2.dll`,
    isBot: false,
  });

  await createLeaderboardUserFolder(leaderboardUserDir);
};

const checkLeaderboardEntryExists = async (userId) => {
  const leaderboardEntry = await Leaderboard.findOne({
    where: { userId },
  });

  return (!!leaderboardEntry);
};

const getWinLossData = async (userId) => {
  const win = await Match.count({
    where: {
      [Op.or]: [{ userId1: userId, verdict: '1' }, { userId2: userId, verdict: '2' }],
    },
  });
  const loss = await Match.count({
    where: {
      [Op.or]: [{ userId1: userId, verdict: '2' }, { userId2: userId, verdict: '1' }],
    },
  });
  const tie = await Match.count({
    where: {
      [Op.or]: [{ userId1: userId, verdict: '0' }, { userId2: userId, verdict: '0' }],
    },
  });
  return { win, tie, loss };
};


module.exports = {
  createLeaderboardEntry,
  updateLeaderboard,
  getWinLossData,
  checkLeaderboardEntryExists,
};
