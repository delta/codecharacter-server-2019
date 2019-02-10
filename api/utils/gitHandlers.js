const path = require('path');
const shell = require('shelljs');
const git = require('simple-git/promise');
const fs = require('fs');
const util = require('util');

const fsWriteFile = util.promisify(fs.writeFile);

const getUserDir = username => `${appPath}/storage/codes/${username}`;

exports.createUserDir = async (username) => {
  const userDir = getUserDir(username);
  const defaultDir = `${appPath}/storage/codes/default`;
  await shell.mkdir(userDir);

  await shell.cp(`${defaultDir}/*`, `${userDir}/`);

  await git(userDir).init();
  await git(userDir).add('./*');
  await git(userDir).commit('Initial Commit');

  return true;
};

exports.latestCommit = async (username) => {
  const userDir = getUserDir(username);
  const logResult = await git(userDir).log();
  return logResult.latest;
};

exports.commitLog = async (username) => {
  const userDir = getUserDir(username);
  const logResult = await git(userDir).log();
  return logResult.all;
};

exports.add = async (username) => {
  const userDir = getUserDir(username);
  return git(userDir).add('./*');
};

exports.diff = async (username) => {
  const userDir = getUserDir(username);
  return git(userDir).diff();
};

exports.diffStaged = async (username) => {
  const userDir = getUserDir(username);
  return git(userDir).diff(['--staged']);
};

exports.commit = async (username, commitMessage) => {
  const userDir = getUserDir(username);
  return git(userDir).commit(commitMessage);
};

exports.getFile = async (username, filename = 'code.cpp', commitHash = null, dir = getUserDir(username)) => {
  let result;
  if (commitHash) {
    result = await git(dir).show([`${commitHash}:${filename}`]);
  } else {
    const catResult = await shell.cat(`${dir}/${filename}`);
    result = catResult.stdout;
  }
  return result;
};

exports.setFile = async (username, fileName = 'code.cpp', fileText, dir = getUserDir(username)) => {
  await fsWriteFile(path.resolve(dir, fileName), fileText);
};

exports.removeDir = async (username) => {
  const userDir = getUserDir(username);
  await shell.rm('-rf', userDir);
};

exports.getUserDir = getUserDir;
