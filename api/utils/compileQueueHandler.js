const request = require('request');
const rp = require('request-promise');
const Constant = require('../models').constant;
const compileBox = require('../models').compilebox;
const CompileQueue = require('../models').compilequeue;
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

async function sendToCompilebox(code) {
  try {
    const availableBoxes = await compileBox.findAll({
      where: { tasks_running: 0 },
    });
    const targetBox = availableBoxes[0];
    const options = {
      method: 'POST',
      uri: `${targetBox.url}/compile`,
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
