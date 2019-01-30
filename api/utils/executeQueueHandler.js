const request = require('request');
const rp = require('request-promise');
const compileBox = require('../models').compilebox;
const { secretString } = require('../config/config');
const Constant = require('../models').constant;
const { ExecuteQueue, Leaderboard } = require('../models');

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

const pushToQueue = async (userId1, userId2, dll1, dll2, isAi, matchId) => {
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
    matchId,
  }).then(() => true)
    .catch(() => false);
};

module.exports = {
  pushToQueue,
  getQueueSize,
};


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
    return response;
  } catch (error) {
    return error;
  }
}


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
      userId1, userId2, dll1, dll2, matchId
    } = executeQueueElement;
    dll1 = dll1.toString();
    dll2 = dll2.toString();
    requestUnderway = true;
    const response = await sendToCompilebox(userId1, userId2, dll1, dll2);

    console.log(response);

    // do something with executeQueueElement and destroy
    const ratingP1Old = 12;
    const ratingP2Old = 13;
    // calculate ratings by some methods by getting game scores
    const ratingP1New = 14;
    const ratingP2New = 14;
    await Leaderboard.update({
      rating: ratingP1New,
    },
    {
      user_id: userId1,
    });
    await Leaderboard.update({
      rating: ratingP2New,
    },
    {
      user_id: userId2,
    });
    
    // update match status here

    // send notifications here

    executeQueueElement.destroy();
    requestUnderway = false;
  });
  return x;
}, 2000);
