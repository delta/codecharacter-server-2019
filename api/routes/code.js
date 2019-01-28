const express = require('express');

const router = express.Router();
const git = require('../utils/gitHandlers');

const { pushToCompileQueue } = require('../utils/compileQueueHandler');

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

router.post('/save', async (req, res) => {
  try {
    const { username } = req.user;
    const { code } = req.body;
    git.setFile(username, code);
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
router.post('/compile', async (req, res) => {
  // find the last match initiated by code1, from both match model and
  // executequeue model and do the timechecking sww
  const userId = req.user.id;
  const code = await git.getFile(req.user.username);
  const success = await pushToCompileQueue(userId, code);
  if (success) {
    res.status(200);
  } else {
    res.status(500);
  }
});
module.exports = router;
