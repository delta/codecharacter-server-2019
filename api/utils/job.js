const compileUtils = require('./compile');
const compileBoxUtils = require('./compileBox');
const CompileQueue = require('../models').compilequeue;

const sendJob = async () => {
  const idleCompileBoxId = await compileBoxUtils.getIdleCompileBox();
  if (idleCompileBoxId === -1) return;

  const compileJob = await compileUtils.getOldestCompileJob();
  if (!compileJob) return;

  await compileUtils.sendCompileJob(compileJob.userId, idleCompileBoxId);

  await CompileQueue.destroy({
    where: {
      id: compileJob.id,
    },
  });

  sendJob();
};

module.exports = {
  sendJob,
};
