const rp = require('request-promise');
const CompileQueue = require('../models').compilequeue;
const compileBoxUtils = require('./compileBox');
const codeStatusUtils = require('./codeStatus');
const git = require('./gitHandlers');
const { secretString } = require('../config/config');
const socket = require('./socketHandlers');
const { getUsername } = require('./user');

const pushToCompileQueue = async (userId) => {
  try {
    const codePath = await codeStatusUtils.getUserCodePath(userId);
    await codeStatusUtils.setUserCodeStatus(userId, 'Waiting');
    await CompileQueue.create({ userId, codePath });

    socket.sendMessage(userId, 'Compilation added to the queue', 'Compile Info');
    return true;
  } catch (err) {
    return false;
  }
};

const setCompileQueueJobStatus = async (queueId, status) => CompileQueue.update({
  status,
}, {
  where: { id: queueId },
});

const getOldestCompileJob = async () => {
  try {
    const compileJob = await CompileQueue.findOne({
      order: [
        ['createdAt', 'ASC'],
      ],
      limit: 1,
    });
    return compileJob;
  } catch (err) {
    throw err;
  }
};

const sendCompileJob = async (userId, compileBoxId) => {
  try {
    if (await compileBoxUtils.getCompileBoxStatus(compileBoxId) === 'BUSY') {
      return {
        type: 'Error',
        error: 'CompileBox not available',
      };
    }

    socket.sendMessage(userId, 'Your code is being compiled...', 'Compile Info');
    await codeStatusUtils.setUserCodeStatus(userId, 'Compiling');
    await compileBoxUtils.changeCompileBoxState(compileBoxId, 'BUSY');

    const code = await git.getFile(await getUsername(userId), 'code.cpp');
    const targetCompileBoxUrl = await compileBoxUtils.getUrl(compileBoxId);

    const options = {
      method: 'POST',
      uri: `${targetCompileBoxUrl}/compile`,
      userId,
      body: {
        code,
        secretString,
      },
      json: true,
    };

    const response = await rp(options);
    await compileBoxUtils.changeCompileBoxState(compileBoxId, 'IDLE');

    const {
      success,
      dll1,
      dll2,
      error,
    } = response;

    if (!success) {
      socket.sendMessage(userId, JSON.stringify(error), 'Compile Error');
      await codeStatusUtils.setUserCodeStatus(userId, 'Idle');
      return {
        type: 'Error',
        error: '',
      };
    }

    const username = await getUsername(userId);
    await git.setFile(username, 'dll1.dll', JSON.stringify(dll1));
    await git.setFile(username, 'dll2.dll', JSON.stringify(dll2));
    await codeStatusUtils.setUserCodeStatus(userId, 'Idle');

    socket.sendMessage(userId, 'Successfully Compiled!', 'Compile Success');

    return {
      type: 'Success',
      error: '',
    };
  } catch (error) {
    socket.sendMessage(userId, 'Internal Server Error', 'Compile Error');
    return {
      type: 'Error',
      error: 'Internal Server Error',
    };
  }
};

module.exports = {
  pushToCompileQueue,
  sendCompileJob,
  getUsername,
  getOldestCompileJob,
  setCompileQueueJobStatus,
};
