const fs = require('fs');
const util = require('util');
const rp = require('request-promise');
// const EloRank = require('elo-rank');
const compileBox = require('../models').compilebox;
const { secretString } = require('../config/config');
// const Constant = require('../models').constant;
// // const Match = require('../models').match;
// const Game = require('../models').game;
// const { ExecuteQueue } = require('../models');
// const Leaderboard = require('../models').leaderboard;
// const { sendMessage } = require('./socketHandlers');
// const compileBoxUtils = require('./compileBox');


const fsReadFile = util.promisify(fs.readFile);

// const elo = new EloRank(15);

// let executeQueueSize;
// Constant.find({
//   where: {
//     key: 'MAX_QUEUED_EXECUTIONS',
//   },
// }).then((constant) => {
//   executeQueueSize = constant.value;
//   if (!constant) {
//     executeQueueSize = 100;
//   }
// })
//   .catch(() => {
//     executeQueueSize = 100;
//   });
// const getQueueSize = async () => ExecuteQueue.findAll({
//   attributes: ['id'],
// }).then(executeQueueElements => executeQueueElements.length)
//   .catch(() => -1);

// const pushToQueue = async (userId1, userId2, dll1, dll2, isAi, gameId) => {
//   const queueLength = await getQueueSize();
//   if (queueLength === executeQueueSize) {
//     return false;
//   }
//   return ExecuteQueue.create({
//     userId1,
//     userId2,
//     dll1,
//     dll2,
//     isAi,
//     gameId,
//   }).then(() => true)
//     .catch(() => { throw new Error(); });
// };


// async function sendToCompilebox(compileBoxAssigned, userId1, userId2, dll1, dll2, gameId, isAi) {
//   try {
//     const targetBox = await compileBox.find({
//       where: { id: compileBoxAssigned },
//     });
//     const options = {
//       method: 'POST',
//       uri: `${targetBox.url}/execute`,
//       body: {
//         userId1,
//         userId2,
//         dll1,
//         dll2,
//         secretString,
//         gameId,
//         isAi,
//         compileBoxId: targetBox.id,
//       },
//       json: true, // Automatically stringifies the body to JSON
//     };
//     const response = await rp(options);
//     return response;
//   } catch (error) {
//     return error;
//   }
// }

// // schedule execution jobs pending in the queue
// const checkAndSendForExecution = async () => {
//   try {
//     const x = await ExecuteQueue.findOne().then(async (executeQueueElement) => {
//       if (!executeQueueElement) {
//         return false;
//       }
//       const compileBoxAssigned = await compileBoxUtils.assignCompileBox();
//       if (compileBoxAssigned === -1) {
//         return false;
//       }
//       const {
//         userId1, userId2, gameId, isAi,
//       } = executeQueueElement;
//       let { dll1, dll2 } = executeQueueElement;
//       dll1 = dll1.toString();
//       dll2 = dll2.toString();
//       sendToCompilebox(compileBoxAssigned, userId1, userId2, dll1, dll2, gameId, isAi);
//       executeQueueElement.destroy();
//       return null;
//     });
//     return x;
//   } catch (error) {
//     return error;
//   }
// };

// const processMatchCompletion = async (response) => {
//   try {
//     const {
//       userId1,
//       userId2,
//       winner,
//       matchLog,
//       errorStatus,
//       gameId,
//       isAi,
//       compileBoxId,
//     } = response.body;
//     const user1 = await Leaderboard.find({ where: { user_id: userId1 } });
//     const user2 = await Leaderboard.find({ where: { user_id: userId2 } });
//     const ratingP1Old = user1.rating;
//     const ratingP2Old = user2.rating;
//     const expectedScoreA = elo.getExpected(ratingP1Old, ratingP2Old);
//     const expectedScoreB = elo.getExpected(ratingP2Old, ratingP1Old);
//     // console.log(response);
//     // initiate 5 games and create 5 promises, wait for them to be resolved, update
//     // each game after completion of each promise,
//     // once all promises are resolved, do this with the match
//     await Game.update({
//       // might be an error log, check errorstatus while creating routes
//       // for match log
//       log: `${matchLog}asfd`,
//       verdict: errorStatus,
//     }, {
//       where: {
//         id: gameId,
//       },
//     });
//     // error handlers for match
//     if (errorStatus) {
//       sendMessage(userId1, {
//         message: 'error occured during runtime',
//       }, 'notification');
//       sendMessage(userId2, {
//         message: 'error occured during runtime',
//       }, 'notification');
//     }
//     if (!isAi) {
//       // calculate ratings by some methods by getting game scores
//       let ratingP1New;
//       let ratingP2New;
//       if (winner === userId1) {
//         ratingP1New = elo.updateRating(expectedScoreA, 1, ratingP1Old);
//         ratingP2New = elo.updateRating(expectedScoreB, 0, ratingP2Old);
//       } else {
//         ratingP1New = elo.updateRating(expectedScoreA, 0, ratingP1Old);
//         ratingP2New = elo.updateRating(expectedScoreB, 1, ratingP2Old);
//       }
//       await Leaderboard.update({
//         rating: ratingP1New,
//       },
//       {
//         user_id: userId1,
//       });
//       await Leaderboard.update({
//         rating: ratingP2New,
//       },
//       {
//         user_id: userId2,
//       });
//       sendMessage(userId1, {
//         winner,
//         message: (winner === userId1) ? 'you win' : 'you lose',
//       }, 'notification');
//       sendMessage(userId2, {
//         winner,
//         message: (winner === userId2) ? 'you win' : 'you lose',
//       }, 'notification');
//     } else {
//       // ai, do nothing but notify user about match completion
//       sendMessage(userId1, {
//         winner,
//         message: (winner === userId2) ? 'you win' : 'you lose',
//         content: (winner === userId2) ? 'you win' : 'you lose',
//         title: 'Match result',
//       }, 'Info');
//     }
//     await compileBoxUtils.makeCompileBoxFree(compileBoxId);
//     await checkAndSendForExecution();
//   } catch (err) {
//     throw new Error();
//   }

//   // send notifications here
// };
// module.exports = {
//   pushToQueue,
//   getQueueSize,
//   processMatchCompletion,
//   checkAndSendForExecution,
// };


// // this will be replaced in places - a new match request - a request from compilebox
// // setInterval(checkAndSendForExecution, 2000);

const getDllFromFile = async (dllPath) => {
  const dllFile = await fsReadFile(dllPath);
  const dll = JSON.parse(dllFile);
  return dll;
};

const sendExecuteJob = async (matchId, dll1Path, dll2Path) => {
  const dll1 = await getDllFromFile(dll1Path);
  const dll2 = await getDllFromFile(dll2Path);
  const userId1 = 1;
  const userId2 = 1;
  const gameId = 1;
  try {
    const targetBox = await compileBox.find({
      where: { id: 1 },
    });
    const options = {
      method: 'POST',
      uri: `${targetBox.url}/execute`,
      body: {
        userId1,
        userId2,
        dll1,
        dll2,
        secretString,
        gameId,
        isAi: false,
        compileBoxId: targetBox.id,
      },
      json: true,
    };
    const response = await rp(options);
    return response;
  } catch (error) {
    return error;
  }
};

module.exports = {
  sendExecuteJob,
};
