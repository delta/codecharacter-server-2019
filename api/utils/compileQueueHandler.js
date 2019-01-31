const request = require('request');
const rp = require('request-promise');
const Constant = require('../models').constant;
const compileBox = require('../models').compilebox;
const { CompileQueue } = require('../models');
const User = require('../models').user;
const git = require('./gitHandlers');
const { secretString } = require('../config/config');
const { sendMessage } = require('../utils/socketHandlers');

const getUserName = async (userId) => {
  return User.findOne({
    where: {
      id: userId,
    },
  }).then(user => user.dataValues.username)
    .catch(() => null);
};
let compileQueueSize;
Constant.find({
  where: {
    key: 'MAX_QUEUED_COMPILATIONS',
  },
}).then((constant) => {
  compileQueueSize = constant.value;
  if (!constant) {
    compileQueueSize = 100;
  }
})
  .catch(() => {
    compileQueueSize = 100;
  });
let requestUnderway = false;
const getQueueSize = async () => CompileQueue.findAll({
  attributes: ['id'],
}).then(compileQueueElements => compileQueueElements.length)
  .catch(() => -1);

const pushToCompileQueue = async (userId, code) => {
  const queueLength = await getQueueSize();
  if (queueLength === compileQueueSize) {
    return false;
  }
  return CompileQueue.create({
    userId,
    code,
  }).then(() => true)
    .catch((err) => { console.log(err); return false; });
};

module.exports = {
  pushToCompileQueue,
  getQueueSize,
};


async function sendToCompilebox(code, userId) {
  try {
    const availableBoxes = await compileBox.findAll({
      where: { tasks_running: 10 },
    });
    const targetBox = availableBoxes[0];
    const options = {
      method: 'POST',
      uri: `${targetBox.url}/compile`,
      userId,
      body: {
        code,
        secretString,
      },
      json: true, // Automatically stringifies the body to JSON
    };
    const response = await rp(options);
    return response;
  } catch (error) {
    return error;
  }
}


// schedule compile jobs pending in the queue
setInterval(async () => {
  if (requestUnderway) {
    return null;
  }
  const x = await CompileQueue.findOne().then(async (compileQueueElement) => {
    if (!compileQueueElement) {
      return null;
    }
    requestUnderway = true;
    let { code, userId } = compileQueueElement;
    code = code.toString();
    const response = await sendToCompilebox(userId, code);
    const { errorBool, log } = response.body;
    // do something with compileQueueElement and destroy
    const dll1 = 'c';
    const dll2 = 'd';
    const username = await getUserName(userId);
    git.setFile(username, 'one.dll', dll1);
    git.setFile(username, 'two.dll', dll2); // modify table to store username and then process it
    sendMessage(userId, {
      message: 'compiled',
      errorBool,
      log,
    }, 'notification');

    compileQueueElement.destroy();
    requestUnderway = false;
  })
    .catch((err) => {
      console.log(err);
    });
  return x;
}, 2000);
