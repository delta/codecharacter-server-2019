const request = require('request');
const rp = require('request-promise');
const compileBox = require('../models').compilebox;
const { secretString } = require('../config/config');
const Constant = require('../models').constant;
const ExecuteQueue = require('../models').ExecuteQueue;

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
  const x = await ExecuteQueue.findOne().then(async (executeQueueElement) => {
    if (!executeQueueElement) {
      return null;
    }
    let {
      userId1, userId2, dll1, dll2,
    } = executeQueueElement;
    dll1 = dll1.toString();
    dll2 = dll2.toString();
    requestUnderway = true;
    const response = await sendToCompilebox(userId1, userId2, dll1, dll2);

    console.log(response);

    // do something with executeQueueElement and destroy

    executeQueueElement.destroy();
    requestUnderway = false;
  });
  return x;
}, 2000);

async function sendToCompilebox(userId1, userId2, dll1, dll2) {
  try {
    const availableBoxes = await compileBox.findAll({
      where: { tasks_running: 10 },
    });
    const targetBox = availableBoxes[0];
    const options = {
      method: 'POST',
      uri: `${targetBox.url}/execute`,
      body: {
        userId1,
        userId2,
        dll1,
        dll2,
        secretString,
      },
      json: true, // Automatically stringifies the body to JSON
    };
    const response = await rp(options);
    // update ratings of users etc
  } catch (error) {
    return error;
  }
}
