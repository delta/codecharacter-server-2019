const CodeStatus = require('../models').codestatus;

const getUserCodePath = async (userId) => {
  try {
    const codestatus = await CodeStatus.findOne({
      where: {
        id: userId,
      },
    });

    return codestatus.latestSrcPath;
  } catch (err) {
    return '';
  }
};

const getUserCodeStatus = async (userId) => {
  try {
    const codestatus = await CodeStatus.findOne({
      where: {
        id: userId,
      },
    });

    return codestatus.status;
  } catch (err) {
    return 'Waiting';
  }
};

const setUserCodeStatus = async (userId, status) => {
  try {
    await CodeStatus.update({
      status,
    }, {
      where: { userId },
    });
    return true;
  } catch (err) {
    return false;
  }
};

module.exports = {
  getUserCodePath,
  setUserCodeStatus,
  getUserCodeStatus,
};
