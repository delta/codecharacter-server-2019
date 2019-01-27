const request = require('request');
const rp = require('request-promise');
const compileBox = require('../models').compilebox;
const { secretString } = require('../config/config');
const Constant = require('../models').constant;
const ExecuteQueue = require('../models').executequeue;

let executeQueueSize;
Constant.find({
  where: {
    key: 'MAX_QUEUED_EXECUTIONS',
  },
}).then((constant) => {
  executeQueueSize = constant.value;
  if (!constant) {
    executeQueueSize = 100;
  }
})
  .catch(() => {
    executeQueueSize = 100;
  });
let requestUnderway = false;
const getQueueSize = async () => ExecuteQueue.findAll({
  attributes: ['id'],
}).then(executeQueueElements => executeQueueElements.length)
  .catch(() => -1);

const pushToQueue = async (userId1, userId2, dll1, dll2, isAi) => {
  const queueLength = await getQueueSize();
  if (queueLength === executeQueueSize) {
    return false;
  }
  return ExecuteQueue.create({
    userId1,
    userId2,
    dll1,
    dll2,
    isAi,
  }).then(() => true)
    .catch(() => false);
};

module.exports = {
  pushToQueue,
  getQueueSize,
};


// schedule execution jobs pending in the queue
setInterval(async () => {
  if (requestUnderway) {
    return null;
  }
  const x = await ExecuteQueue.findOne().then((executeQueueElement) => {
    const {
      userId1, userId2, dll1, dll2,
    } = executeQueueElement;
    requestUnderway = true;
    // do something with executeQueueElement and destroy
    executeQueueElement.destroy();
    requestUnderway = false;
  });
  return x;
}, 300);

async function sendToCompilebox(code) {
  try {
    const availableBoxes = await compileBox.findAll({
      where: { tasks_running: 0 },
    });
    const targetBox = availableBoxes[0];
    const options = {
      method: 'POST',
      uri: `${targetBox.url}/execute`,
      body: {
        code,
        secretString,
      },
      json: true, // Automatically stringifies the body to JSON
    };
    const response = await rp(options);
    console.log(response);
  } catch (error) {
    return error;
  }
}
