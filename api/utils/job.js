const matchUtils = require('./match');
const compileUtils = require('./compile');
const executeUtils = require('./execute');
const debugUtils = require('./debug');
const compileBoxUtils = require('./compileBox');
const CompileQueue = require('../models').compilequeue;
const ExecuteQueue = require('../models').executequeue;

const sendJob = async () => {
  const date = new Date();
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const localDate = new Date(utc + (3600000 * 5.5));
  console.log(localDate.toLocaleString());

  const idleCompileBoxId = await compileBoxUtils.getIdleCompileBox();
  if (idleCompileBoxId === -1) return;

  const compileJob = await compileUtils.getOldestCompileJob();
  const executeJob = await executeUtils.getOldestExecuteJob();
  const debugJob = await debugUtils.getOldestDebugJob();

  let jobType;
  if (compileJob) {
    jobType = 'compile';
  } else if (executeJob) {
    jobType = 'execute';
  } else if (debugJob) {
    jobType = 'debug';
  } else {
    return;
  }

  await compileBoxUtils.changeCompileBoxState(idleCompileBoxId, 'BUSY');
  if (jobType === 'compile') {
    const { userId, commitHash } = compileJob;

    await compileUtils.setCompileQueueJobStatus(compileJob.id, 'COMPILING');
    await compileUtils.sendCompileJob(userId, idleCompileBoxId, commitHash);

    await CompileQueue.destroy({
      where: { id: compileJob.id },
    });
  } else if (jobType === 'execute') {
    await executeUtils.setExecuteQueueJobStatus(executeJob.id, 'EXECUTING');
    const {
      popFromQueue,
      score1 = 0,
      score2 = 0,
      interestingness = 0,
    } = await executeUtils.sendExecuteJob(
      executeJob.gameId,
      idleCompileBoxId,
      executeJob.userId1,
      executeJob.userId2,
      executeJob.aiId,
      executeJob.mapId,
      executeJob.type,
      executeJob.dll1Path,
      executeJob.dll2Path,
    );

    if (popFromQueue) {
      const executeJobType = executeJob.type;
      await ExecuteQueue.destroy({
        where: {
          id: executeJob.id,
        },
      });
      if (executeJobType === 'USER_MATCH') {
        await matchUtils.updateMatchResults(executeJob.gameId, score1, score2, interestingness);
      }
    }
  } else {
    const {
      userId, code1, code2, map,
    } = debugJob;

    await debugUtils.setDebugJobStatus(debugJob.id, 'EXECUTING');
    await debugUtils.sendDebugJob(userId, idleCompileBoxId, debugJob.id, code1, code2, map);
    await debugUtils.destroyDebugJob(debugJob.id);
  }
  await compileBoxUtils.changeCompileBoxState(idleCompileBoxId, 'IDLE');

  sendJob();
};

const startJobs = async () => {
  const compileJobs = (await CompileQueue.update({ status: 'QUEUED' }, { where: {} }))[0];
  const executeJobs = (await ExecuteQueue.update({ status: 'QUEUED' }, { where: {} }))[0];
  for (let i = 0; i < compileJobs + executeJobs; i += 1) {
    sendJob();
  }
};

module.exports = {
  sendJob,
  startJobs,
};
