const express = require('express');
const { check } = require('express-validator/check');
const { handleValidationErrors } = require('../utils/validation');
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
    if ((await codeStatusUtils.getUserCodeStatus(id)) !== 'Idle') {
      return res.status(400).json({
        type: 'Error',
        error: 'Job already in queue',
      });
    }

    await compileUtils.pushToCompileQueue(id, commitHash);
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
    });

    const mapsData = [];

    maps.forEach((map) => {
      const mapData = {};
      mapData.mapId = map.mapId;
      mapData.name = map.name;
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
