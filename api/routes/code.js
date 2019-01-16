const express = require('express');

const router = express.Router();
const git = require('../utils/git_handlers');

router.get('/latest', async (req, res) => {
  const { username } = req.user;
  const latestCommitHash = await git.latestCommit(username);
  const fileContent = await git.getFile(username, 'code.cpp', latestCommitHash.hash);
  res.status(200).json({
    code: fileContent,
  });
});

router.post('/save', async (req, res) => {
  const { username, code } = req.user;
  git.setFile(username, code);
  await git.add(username);
  res.sendStatus(200);
});


router.post('/commit', async (req, res) => {
  const { username } = req.user;
  const { commitMessage } = req.body;
  await git.add(username);
  await git.commit(username, commitMessage);
  res.sendStatus(200);
});

router.get('/log', async (req, res) => {
  const { username } = req.user;
  res.status(200).json({
    log: await git.commitLog(username),
  });
});

router.get('/view/:commitHash', async (req, res) => {
  const { username } = req.user;
  const { commitHash } = req.params;
  const fileContent = await git.getFile(username, 'code.cpp', commitHash);

  res.status(200).json({
    code: fileContent,
  });
});

router.get('/fork/:commitHash', async (req, res) => {
  const { username } = req.user.username;
  const { commitHash } = req.params;

  const fileContent = await git.getFile(username, 'code.cpp', commitHash);
  git.setFile(username, fileContent);
  await git.add(username);
  await git.commit(username);
  res.sendStatus(200);
});
module.exports = router;
