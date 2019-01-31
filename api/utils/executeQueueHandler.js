const rp = require('request-promise');
const EloRank = require('elo-rank');
const compileBox = require('../models').compilebox;
const { secretString } = require('../config/config');
const Constant = require('../models').constant;
const Match = require('../models').match;
const { ExecuteQueue, Leaderboard } = require('../models');
const { sendMessage } = require('../utils/socketHandlers');

const elo = new EloRank(15);

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
    const {
      userId1, userId2, matchId, isAi,
    } = executeQueueElement;
    let { dll1, dll2 } = executeQueueElement;
    dll1 = dll1.toString();
    dll2 = dll2.toString();
    requestUnderway = true;
    const response = await sendToCompilebox(userId1, userId2, dll1, dll2);


    const user1 = await Leaderboard.find({ where: { user_id: userId1 } });
    const user2 = await Leaderboard.find({ where: { user_id: userId2 } });
    const ratingP1Old = user1.rating;
    const ratingP2Old = user2.rating;


    const expectedScoreA = elo.getExpected(ratingP1Old, ratingP2Old);
    const expectedScoreB = elo.getExpected(ratingP2Old, ratingP1Old);
    // console.log(response);
    const { winner, matchLog, errorStatus } = response.body;
    // do something with executeQueueElement and destroy
    if (!isAi) {
      // calculate ratings by some methods by getting game scores
      let ratingP1New;
      let ratingP2New;
      if (winner === userId1) {
        ratingP1New = elo.updateRating(expectedScoreA, 1, ratingP1Old);
        ratingP2New = elo.updateRating(expectedScoreB, 0, ratingP2Old);
      } else {
        ratingP1New = elo.updateRating(expectedScoreA, 0, ratingP1Old);
        ratingP2New = elo.updateRating(expectedScoreB, 1, ratingP2Old);
      }
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
    }
    // update match status here

    // initiate 5 games and create 5 promises, wait for them to be resolved, update
    // each game after completion of each promise,
    // once all promises are resolved, do this with the match
    await Match.update({
      match_log: matchLog,
      verdict: errorStatus,
    }, {
      id: matchId,
    });

    // send notifications here
    sendMessage(userId1, {
      winner,
      message: (winner === userId1) ? 'you win' : 'you lose',
    }, 'notification');

    sendMessage(userId2, {
      winner,
      message: (winner === userId2) ? 'you win' : 'you lose',
    }, 'notification');

    executeQueueElement.destroy();
    requestUnderway = false;
    return null;
  });
  return x;
}, 2000);
