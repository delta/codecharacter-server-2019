const express = require('express');
const compileUtils = require('../utils/compile');
const codeStatusUtils = require('../utils/codeStatus');
const jobUtils = require('../utils/job');

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

module.exports = router;
