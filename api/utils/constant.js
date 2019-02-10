const Constant = require('../models').constant;

const minMatchWaitTime = async () => {
  const matchWaitTimeConstant = await Constant.findOne({
    where: { key: 'MATCH_WAIT_TIME' },
  });

  return Number(matchWaitTimeConstant.value);
};

const initialRating = async () => {
  const initialRatingValue = await Constant.findOne({
    where: { key: 'INITIAL_RATING' },
  });

  return Number(initialRatingValue.value);
};

const getCodeStorageDir = async () => {
  const codeStorageDir = await Constant.findOne({
    where: { key: 'DEFAULT_CODE_STORAGE_DIR' },
  });

  return codeStorageDir.value;
};

const getLeaderboardStorageDir = async () => {
  const leaderboardStorageDir = await Constant.findOne({
    where: { key: 'DEFAULT_LEADERBOARD_STORAGE_DIR' },
  });

  return leaderboardStorageDir.value;
};

const getMatchLogDir = async () => {
  const storageDir = await Constant.findOne({
    where: { key: 'DEFAULT_MATCH_LOG_STORAGE_DIR' },
  });

  return storageDir.value;
};

module.exports = {
  minMatchWaitTime,
  initialRating,
  getCodeStorageDir,
  getMatchLogDir,
  getLeaderboardStorageDir,
};
