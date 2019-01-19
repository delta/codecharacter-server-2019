const path = require('path');
const shell = require('shelljs');
const git = require('simple-git');
const fs = require('fs');

const getUserDir = username => `${appPath}/storage/codes/${username}`;

exports.createUserDir = async (username) => {
  const userDir = getUserDir(username);
  const defaultDir = `${appPath}/storage/codes/default`;
  await shell.mkdir(userDir);

  if (await shell.exec(`cp ${defaultDir}/code.cpp ${userDir}/`).code !== 0) {
    return false;
  }

  git(userDir)
    .init()
    .add('./*')
    .commit('Initial Commit');

  return true;
};

exports.latestCommit = async (username) => {
  const userDir = getUserDir(username);
  let latestLog;
  await git(userDir).log((err, log) => {
    latestLog = log.latest;
  });
  return latestLog;
};

exports.commitLog = async (username) => {
  const userDir = getUserDir(username);
  let commitLog;
  await git(userDir).log((err, log) => {
    commitLog = log.all;
  });
  return commitLog;
};

exports.add = async (username) => {
  const userDir = getUserDir(username);
  return git(userDir).add('./*');
};

exports.commit = async (username, commitMessage) => {
  const userDir = getUserDir(username);
  return git(userDir).commit(commitMessage);
};

exports.getFile = async (username, filename = 'code.cpp', commitHash = null) => {
  const userDir = getUserDir(username);
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
