const request = require('request');

const Constant = require('../models').constant;
const CompileQueue = require('../models').compilequeue;

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

const { secretString, compileBoxUrl } = require('../config/config.js').compileBox;

const pushToQueue = async (userId, code) => {
  const queueLength = await getQueueSize();
  if (queueLength === compileQueueSize) {
    return false;
  }
  return CompileQueue.create({
    userId,
    code,
  }).then(() => true)
    .catch(() => false);
};

module.exports = {
  pushToQueue,
  getQueueSize,
};


// schedule compile jobs pending in the queue
setInterval(async () => {
  if (requestUnderway) {
    return null;
  }
  const x = await CompileQueue.findOne().then((compileQueueElement) => {
    const { code, userId } = compileQueueElement;
    // do something with compileQueueElement and destroy
    compileQueueElement.destroy();
  });
  return x;
}, 300);
