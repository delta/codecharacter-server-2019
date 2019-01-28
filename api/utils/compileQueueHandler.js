const request = require('request');
const rp = require('request-promise');
const Constant = require('../models').constant;
const compileBox = require('../models').compilebox;
const CompileQueue = require('../models').CompileQueue;
const git = require('./gitHandlers');
const { secretString } = require('../config/config');

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
const requestUnderway = false;
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
    .catch((err) => { console.log(err); });
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
    let { code, userId } = compileQueueElement;
    code = code.toString();
    const response = await sendToCompilebox(userId, code);
    // do something with compileQueueElement and destroy
    console.log(response);
    const dll1 = 'a';
    const dll2 = 'b';
    // git.setFile(userId, 'one.dll', dll1);
    // git.setFile(userId, 'two.dll', dll2); modify table to store username and then process it
    compileQueueElement.destroy();
  })
    .catch((err) => {
      console.log(err);
    });
  return x;
}, 2000);
