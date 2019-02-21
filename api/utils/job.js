const matchUtils = require('./match');
const compileUtils = require('./compile');
const executeUtils = require('./execute');
const codeStatusUtils = require('./codeStatus');
const compileBoxUtils = require('./compileBox');
const CompileQueue = require('../models').compilequeue;
const ExecuteQueue = require('../models').executequeue;

const sendJob = async () => {
  const idleCompileBoxId = await compileBoxUtils.getIdleCompileBox();
  if (idleCompileBoxId === -1) return;

  const compileJob = await compileUtils.getOldestCompileJob();
  const executeJob = await executeUtils.getOldestExecuteJob();

  let jobtype;
  if (compileJob && executeJob) {
    if (compileJob.createdAt.getTime() > executeJob.createdAt.getTime()) {
      jobtype = 'execute';
    } else {
      jobtype = 'compile';
    }
  } else if (compileJob && !executeJob) {
    jobtype = 'compile';
  } else if (executeJob && !compileJob) {
    jobtype = 'execute';
  } else {
    return;
  }

  if (jobtype === 'compile') {
    const { userId, commitHash } = compileJob;

    await compileUtils.setCompileQueueJobStatus(compileJob.id, 'COMPILING');
    await compileUtils.sendCompileJob(userId, idleCompileBoxId, commitHash);

    await codeStatusUtils.setUserCodeStatus(userId, 'Idle');
    await CompileQueue.destroy({
      where: { id: compileJob.id },
    });
  } else {
    await executeUtils.setExecuteQueueJobStatus(executeJob.id, 'EXECUTING');

    const {
      popFromQueue,
      matchId,
      score1,
      score2,
    } = await executeUtils.sendExecuteJob(
      executeJob.gameId,
      idleCompileBoxId,
      executeJob.userId1,
      executeJob.userId2,
      executeJob.mapId,
      executeJob.type,
      executeJob.dll1Path,
      executeJob.dll2Path,
    );

    if (popFromQueue) {
      await ExecuteQueue.destroy({
        where: {
          id: executeJob.id,
        },
      });
      if (executeJob.type === 'USER_MATCH') {
        await matchUtils.updateMatchResults(matchId, score1, score2);
      }
    }
  }

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
