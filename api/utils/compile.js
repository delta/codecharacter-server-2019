const rp = require('request-promise');
const CompileQueue = require('../models').compilequeue;
const compileBoxUtils = require('./compileBox');
const codeStatusUtils = require('./codeStatus');
const constantUtils = require('./constant');
const git = require('./gitHandlers');
const { secretString } = require('../config/config');
const socket = require('./socketHandlers');
const { getUsername } = require('./user');

const compileQueueSize = async () => CompileQueue.count();

const pushToCompileQueue = async (userId, commitHash) => {
  try {
    const queueSize = await compileQueueSize();
    const limit = await constantUtils.getCompileQueueLimit();
    if (queueSize >= limit) {
      socket.sendMessage(userId, 'Queue is full. Try again later', 'Compile Error');
      return {
        success: false,
        error: 'QUEUE_FULL',
      };
    }
    const codePath = await codeStatusUtils.getUserCodePath(userId);
    await codeStatusUtils.setUserCodeStatus(userId, 'Waiting');
    await CompileQueue.create({ userId, codePath, commitHash });

    return {
      success: true,
      error: '',
    };
  } catch (err) {
    return {
      success: false,
      error: 'SERVER_ERROR',
    };
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

const sendCompileJob = async (userId, compileBoxId, commitHash) => {
  try {
    if (await compileBoxUtils.getCompileBoxStatus(compileBoxId) === 'BUSY') {
      socket.sendMessage(userId, 'Internal Server Error', 'Compile Error');
    }

    socket.sendMessage(userId, 'Your code is being compiled...', 'Compile Info');

    await codeStatusUtils.setUserCodeStatus(userId, 'Compiling');
    await compileBoxUtils.changeCompileBoxState(compileBoxId, 'BUSY');

    const code = await git.getFile(await getUsername(userId), 'code.cpp', (commitHash !== 'latest' ? commitHash : null));
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
      errorType,
    } = response;

    if (!success) {
      if (errorType === 'COMPILE_ERROR') {
        socket.sendMessage(userId, error, 'Compile Error Log');
      } else if (errorType === 'UNAUTHORIZED') {
        socket.sendMessage(userId, 'Internal Server Error', 'Compile Error');
        console.log('Secret string mismatch');
      } else if (errorType === 'BOX_BUSY') {
        socket.sendMessage(userId, 'Server is busy... Please try again later.', 'Compile Error');
      } else {
        socket.sendMessage(userId, 'Internal Server Error', 'Compile Error');
      }

      return;
    }

    const username = await getUsername(userId);
    await git.setFile(username, (commitHash === 'latest' ? 'dll1.dll' : 'dll1_previous_commit.dll'), JSON.stringify(dll1));
    await git.setFile(username, (commitHash === 'latest' ? 'dll2.dll' : 'dll2_previous_commit.dll'), JSON.stringify(dll2));
    await codeStatusUtils.setUserCodeStatus(userId, 'Idle');

    socket.sendMessage(userId, 'Successfully Compiled!', 'Compile Success');
  } catch (error) {
    socket.sendMessage(userId, 'Internal Server Error', 'Compile Error');
  }
};

module.exports = {
  pushToCompileQueue,
  sendCompileJob,
  getUsername,
  getOldestCompileJob,
  setCompileQueueJobStatus,
};
