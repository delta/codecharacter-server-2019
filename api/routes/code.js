const express = require('express');
const { check } = require('express-validator/check');
const { handleValidationErrors } = require('../utils/validation');
const git = require('../utils/gitHandlers');
const CodeStatus = require('../models').codestatus;
const Leaderboard = require('../models').leaderboard;

const router = express.Router();
const socket = require('../utils/socketHandlers');
const codeStatusUtils = require('../utils/codeStatus');
const leaderboardUtils = require('../utils/leaderboard');

router.get('/latest', async (req, res) => {
  try {
    const { username } = req.user;
    const fileContent = await git.getFile(username, 'code.cpp');
    res.status(200).json({
      type: 'Success',
      error: '',
      code: fileContent,
    });
  } catch (err) {
    res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.get('/lastsave', async (req, res) => {
  try {
    const code = await CodeStatus.findOne({
      where: {
        userId: req.user.id,
      },
    });
    const lastSavedAt = code.lastSavedAt.toUTCString();
    res.status(200).json({
      type: 'Success',
      error: '',
      lastSavedAt,
    });
  } catch (error) {
    res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.post('/save', [
  check('code')
    .exists().withMessage('code is required')
    .custom(value => typeof value === 'string')
    .withMessage('code should be a string'),
], async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) return null;
    const { username, id } = req.user;

    const userCodeStatus = await codeStatusUtils.getUserCodeStatus(id);
    if (userCodeStatus === 'Compiling' || userCodeStatus === 'Waiting') {
      return res.status(200).json({
        type: 'Error',
        error: 'Cannot edit code when compiling',
      });
    }

    const { code } = req.body;
    git.setFile(username, 'code.cpp', code);
    await git.add(username);
    await CodeStatus.update({
      lastSavedAt: new Date(),
    }, {
      where: { userId: req.user.id },
    });
    socket.sendMessage(id, 'Saved!', 'Success');
    return res.status(200).json({
      type: 'Success',
      error: '',
    });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.post('/lock', async (req, res) => {
  try {
    const { id, username } = req.user;

    const leaderboardEntry = await Leaderboard.findOne({
      where: {
        userId: id,
      },
    });

    if (!leaderboardEntry) {
      await leaderboardUtils.createLeaderboardEntry(id, username);
    }

    await leaderboardUtils.updateLeaderboard(username);

    res.status(200).json({
      type: 'Success',
      error: '',
    });
  } catch (err) {
    res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.post('/commit', [
  check('commitMessage')
    .not().isEmpty().withMessage('commitMessage cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('Commit message must be 1-50 characters long'),
], async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) return null;
    const { username, id } = req.user;
    const { commitMessage } = req.body;
    await git.add(username);
    const diff = await git.diffStaged(username);
    if (diff === '') {
      return res.status(200).json({
        type: 'Error',
        error: 'No changes have been made',
      });
    }

    await git.commit(username, commitMessage);
    socket.sendMessage(id, `Commit "${commitMessage}" has been saved`, 'Success');

    return res.status(200).json({
      type: 'Success',
      error: '',
    });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.get('/log', async (req, res) => {
  try {
    const { username } = req.user;
    const log = await git.commitLog(username);
    res.status(200).json({
      type: 'Success',
      error: '',
      log,
    });
  } catch (err) {
    res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.get('/view/:commitHash', [
  check('commitHash')
    .exists().withMessage('commitHash is required'),
], async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) return null;
    const { username } = req.user;
    const { commitHash } = req.params;
    const fileContent = await git.getFile(username, 'code.cpp', commitHash === 'latest' ? null : commitHash);
    return res.status(200).json({
      type: 'Success',
      error: '',
      code: fileContent,
    });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.get('/fork/:commitHash', [
  check('commitHash')
    .exists().withMessage('commitHash is required')
    .isLength(40)
    .withMessage('commitHash should be of 40 characters')
    .custom(value => typeof value === 'string')
    .withMessage('commitHash should be a string'),

], async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) return null;
    const { username } = req.user;
    const { commitHash } = req.params;
    const fileContent = await git.getFile(username, 'code.cpp', commitHash);
    git.setFile(username, fileContent);
    await git.add(username);
    return res.status(200).json({
      type: 'Success',
      error: '',
    });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

module.exports = router;
