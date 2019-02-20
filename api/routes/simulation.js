const express = require('express');
const { check } = require('express-validator/check');
const { handleValidationErrors } = require('../utils/validation');
const socket = require('../utils/socketHandlers');
const compileUtils = require('../utils/compile');
const codeStatusUtils = require('../utils/codeStatus');
const jobUtils = require('../utils/job');
const matchUtils = require('../utils/match');
const executeUtils = require('../utils/execute');
const Map = require('../models').map;

const router = express.Router();

router.post('/compile', [
  check('commitHash')
    .not().isEmpty().isAlphanumeric(),
], async (req, res) => {
  if (handleValidationErrors(req, res)) return null;

  const { id } = req.user;
  const { commitHash } = req.body;

  try {
    const userCodeStatus = (await codeStatusUtils.getUserCodeStatus(id));

    if (userCodeStatus !== 'Idle') {
      socket.sendMessage(id, 'Code is already in queue. Please wait.', 'Compile Error');

      return res.status(400).json({
        type: 'Error',
        error: 'Code is already being compiled.',
      });
    }

    const result = await compileUtils.pushToCompileQueue(id, commitHash);
    if (result) {
      socket.sendMessage(id, 'Code has been added to the queue... Please wait.', 'Compile Info');
      jobUtils.sendJob();
    } else {
      socket.sendMessage(id, 'Internal Server Error. Please try again later.', 'Compile Error');
    }

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

router.post('/match', [
  check('opponentId')
    .not().isEmpty().withMessage('opponentId cannot be empty')
    .isInt(),
], async (req, res) => {
  if (handleValidationErrors(req, res)) return null;

  const { id } = req.user;
  const { opponentId } = req.body;

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

router.post('/match/self', [
  check('mapId')
    .not().isEmpty().withMessage('mapId cannot be empty')
    .isInt(),
], async (req, res) => {
  if (handleValidationErrors(req, res)) return null;

  const { id } = req.user;
  const { mapId } = req.body;

  try {
    const result = await executeUtils.pushSelfMatchToQueue(id, mapId);

    if (result) {
      jobUtils.sendJob();
      return res.status(200).json({
        type: 'Success',
        error: '',
      });
    }

    return res.status(400).json({
      type: 'Error',
      error: 'No compiled DLLs',
    });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

// Executes match between current dll and dll of previous compiled commit
router.post('/match/commit', [
  check('mapId')
    .not().isEmpty().withMessage('mapId cannot be empty')
    .isInt(),
], async (req, res) => {
  if (handleValidationErrors(req, res)) return null;

  const { id } = req.user;
  const { mapId } = req.body;

  try {
    const result = await executeUtils.pushCommitMatchToQueue(id, mapId);

    if (result) {
      jobUtils.sendJob();
      return res.status(200).json({
        type: 'Success',
        error: '',
      });
    }

    return res.status(400).json({
      type: 'Error',
      error: 'No compiled DLLs',
    });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

// get all maps available
router.get('/maps', async (req, res) => {
  try {
    const maps = await Map.findAll({
      attributes: ['id', 'name'],
      where: {
        isHidden: false,
      },
    });

    const mapsData = [];

    maps.forEach((map) => {
      const mapData = {};
      mapData.mapId = map.id;
      mapData.name = map.name;
      mapData.isHidden = map.isHidden;
      mapsData.push(mapData);
    });

    return res.status(200).json({ type: 'Success', error: '', mapsData });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

module.exports = router;
