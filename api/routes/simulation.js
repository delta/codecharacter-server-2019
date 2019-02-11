const express = require('express');
const compileUtils = require('../utils/compile');
const codeStatusUtils = require('../utils/codeStatus');
const jobUtils = require('../utils/job');
const matchUtils = require('../utils/match');

const router = express.Router();

router.post('/compile', async (req, res) => {
  const { id } = req.user;
  try {
    if ((await codeStatusUtils.getUserCodeStatus(id)) !== 'Idle') {
      return res.status(400).json({
        type: 'Error',
        error: 'Job already in queue',
      });
    }

    await compileUtils.pushToCompileQueue(id);
    jobUtils.sendJob();

    return res.status(200).json({
      type: 'Success',
      error: '',
    });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

router.post('/match', async (req, res) => {
  const { id } = req.user;
  let { opponentId } = req.body;
  opponentId = Number(opponentId);

  try {
    const startMatchResponse = await matchUtils.startMatch(id, opponentId);

    if (startMatchResponse.success) {
      return res.status(200).json({
        type: 'Success',
        error: '',
      });
    }

    return res.status(400).json({
      type: 'Error',
      error: startMatchResponse.message,
    });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

module.exports = router;
