const express = require('express');
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

router.post('/save', async (req, res) => {
  try {
    const { username, id } = req.user;

    const userCodeStatus = await codeStatusUtils.getUserCodeStatus(id);
    if (userCodeStatus === 'Compiling' || userCodeStatus === 'Waiting') {
      res.status(200).json({
        type: 'Error',
        error: 'Cannot edit code when compiling',
      });
      return;
    }

    const { code } = req.body;
    git.setFile(username, code);
    await git.add(username);
    await CodeStatus.update({
      lastSavedAt: new Date(),
    }, {
      where: { userId: req.user.id },
    });
    socket.sendMessage(id, 'Saved!', 'Success');
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

router.post('/commit', async (req, res) => {
  try {
    const { username } = req.user;
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

router.get('/view/:commitHash', async (req, res) => {
  try {
    const { username } = req.user;
    const { commitHash } = req.params;
    const fileContent = await git.getFile(username, 'code.cpp', commitHash === 'latest' ? null : commitHash);
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

router.get('/fork/:commitHash', async (req, res) => {
  try {
    const { username } = req.user;
    const { commitHash } = req.params;
    const fileContent = await git.getFile(username, 'code.cpp', commitHash);
    git.setFile(username, fileContent);
    await git.add(username);
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

module.exports = router;
