const rp = require('request-promise');
const DebugQueue = require('../models').debugqueue;
const compileBoxUtils = require('./compileBox');
const constantUtils = require('./constant');
const git = require('./gitHandlers');
const { secretString } = require('../config/config');
const socket = require('./socketHandlers');
const { getUsername } = require('./user');
const { getMap } = require('./map');

const debugQueueSize = async () => DebugQueue.count();

const destroyDebugJob = async (id) => {
  try {
    await DebugQueue.destroy({
      where: {
        id,
      },
    });
  } catch (err) {
    console.log(err);
  }
};

const getOldestDebugJob = async () => {
  try {
    const debugJob = await DebugQueue.findOne({
      order: [
        ['createdAt', 'ASC'],
      ],
      where: {
        status: 'QUEUED',
      },
      limit: 1,
    });
    return debugJob;
  } catch (err) {
    throw err;
  }
};

const setDebugJobStatus = async (id, status) => {
  const debugJob = await DebugQueue.findOne({
    where: { id },
  });

  if (!debugJob) return false;

  debugJob.status = status;
  await debugJob.save();

  return true;
};

const checkUserInQueue = async (userId) => {
  const queueEntry = await DebugQueue.findOne({
    where: {
      userId,
    },
  });

  return (!!queueEntry);
};

const pushToDebugQueue = async (userId, code1, code2, map) => {
  try {
    const queueSize = await debugQueueSize();
    const limit = await constantUtils.getDebugQueueLimit();

    if (queueSize >= limit) {
      socket.sendMessage(userId, 'Server is busy. Please try again later', 'Debug Run Error');
      return {
        success: false,
        error: 'QUEUE_FULL',
      };
    }

    if (await checkUserInQueue(userId)) {
      socket.sendMessage(userId, 'Please wait for your previous debug run to complete :)', 'Debug Run Error');
      return {
        success: false,
        error: 'WAIT',
      };
    }

    await DebugQueue.create({
      userId,
      code1,
      code2,
      map,
    });

    return {
      success: true,
      error: '',
    };
  } catch (err) {
    console.log(err);
    return {
      success: false,
      error: 'SERVER_ERROR',
    };
  }
};

const debugRun = async (userId, code, type, mapId, commitHash = null) => {
  try {
    const map = await getMap(mapId);

    if (type === 'SELF_MATCH') {
      await pushToDebugQueue(userId, code, code, map);
    } else if (type === 'PREVIOUS_COMMIT_MATCH') {
      const previousCommitCode = await git.getFile(await getUsername(userId), 'code.cpp', commitHash);
      await pushToDebugQueue(userId, code, previousCommitCode, map);
    } else if (type === 'AI_MATCH') {
      // TODO: Need to implement debug runs on ai matches
    } else {
      socket.sendMessage(userId, 'Invalid Type', 'Debug Run Error');
      return {
        success: false,
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.log(err);
    return {
      success: false,
    };
  }
};

const sendDebugJob = async (userId, compileBoxId, debugJobId, code1, code2, map) => {
  try {
    socket.sendMessage(userId, 'Your code is running in debug mode...', 'Debug Run Info');

    const targetCompileBoxUrl = await compileBoxUtils.getUrl(compileBoxId);

    const options = {
      method: 'POST',
      uri: `${targetCompileBoxUrl}/debug`,
      userId,
      body: {
        code1,
        code2,
        map,
        secretString,
      },
      json: true,
    };

    const response = await rp(options);
    await setDebugJobStatus(debugJobId, 'EXECUTING');

    if (response.success) {
      socket.sendMessage(userId, response.trace, 'Debug Run Success');
    } else {
      socket.sendMessage(userId, 'Something went wrong...', 'Debug Run Error');
    }

    return {
      success: true,
    };
  } catch (err) {
    console.log(err);
    return {
      success: false,
    };
  }
};

module.exports = {
  debugRun,
  sendDebugJob,
  getOldestDebugJob,
  setDebugJobStatus,
  destroyDebugJob,
};
