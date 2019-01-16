const path = require('path');
const shell = require('shelljs');
const git = require('simple-git');
const fs = require('fs');

exports.createUserDir = async (username) => {
  const userDir = `${path.resolve('storage/codes/')}/${username}`;

  shell.mkdir(userDir);
  shell.cd(userDir);

  if (shell.exec('cp ../default/code.cpp .').code !== 0) {
    return false;
  }

  git(userDir)
    .init()
    .add('./*')
    .commit('Initial Commit');

  return true;
};

exports.latestCommit = async (username) => {
  const userDir = `${path.resolve('storage/codes/')}/${username}`;
  let latestLog;
  await git(userDir).log((err, log) => {
    latestLog = log.latest;
  });
  return latestLog;
};

exports.commitLog = async (username) => {
  const userDir = `${path.resolve('storage/codes/')}/${username}`;
  let commitLog;
  await git(userDir).log((err, log) => {
    commitLog = log.all;
  });
  return commitLog;
};

exports.add = async (username) => {
  const userDir = `${path.resolve('storage/codes/')}/${username}`;
  return git(userDir).add('./*');
};

exports.commit = async (username, commitMessage) => {
  const userDir = `${path.resolve('storage/codes/')}/${username}`;
  return git(userDir).commit(commitMessage);
};

exports.getFile = async (username, filename = 'code.cpp', commitHash = null) => {
  const userDir = `${path.resolve('storage/codes/')}/${username}`;
  let file;
  await git(userDir).show([(commitHash ? `${commitHash}:${filename}` : '')], (err, resolvedFile) => {
    file = resolvedFile;
  });

  return file;
};


exports.setFile = async (username, fileText) => {
  const userDir = `${path.resolve('storage/codes/')}/${username}`;
  fs.writeFileSync(path.resolve(userDir, 'code.cpp'), fileText);
  return null;
};
