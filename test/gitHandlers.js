process.env.NODE_ENV = 'test';
const path = require('path');
const chai = require('chai');
// eslint-disable-next-line
const shell = require('shelljs');
const git = require('simple-git/promise');
const fs = require('fs');
const randomString = require('randomstring');
const util = require('util');
const GitHandler = require('../api/utils/gitHandlers');

const fsWriteFile = util.promisify(fs.writeFile);

appPath = path.resolve('../codecharacter-server-2019/');
const getUserDir = username => `${appPath}/storage/codes/${username}`;

describe('Test Git Handlers', async () => {
  const username = 'gitHandler_testusername';
  const userDir = getUserDir(username);
  const initialCommitMessage = 'Initial Commit';
  const text = new Array(8);
  // eslint-disable-next-line no-undef
  before(async () => {
    for (let index = 0; index < 10; index += 1) {
      text[index] = randomString.generate(10);
    }
  });
  // eslint-disable-next-line no-undef
  after(async () => {
    await shell.rm('-rf', userDir);
  });
  it('test createUserDir', async () => {
    const handlerResponse = await GitHandler.createUserDir(username);
    chai.assert(await shell.test('-d', userDir) === true);
    const logResult = await git(userDir).log();
    chai.assert(await logResult.latest.message.includes(initialCommitMessage));
    chai.assert(handlerResponse === true);
  });

  it('test latestCommit', async () => {
    await fsWriteFile(`${userDir}/code.cpp`, text[0]);
    await git(userDir).init();
    await git(userDir).add('./*');
    await git(userDir).commit(text[0]);
    const latestCommit = await GitHandler.latestCommit(username);
    chai.assert(latestCommit.message.includes(text[0]));
  });

  it('test commitLog', async () => {
    await fsWriteFile(`${userDir}/code.cpp`, text[1]);
    await git(userDir).init();
    await git(userDir).add('./*');
    await git(userDir).commit(text[1]);
    const commitLog = await GitHandler.commitLog(username);
    chai.assert(commitLog[0].message.includes(text[1]));
    chai.assert(commitLog[1].message.includes(text[0]));
    chai.assert(commitLog[2].message.includes(initialCommitMessage));
  });

  it('test add', async () => {
    await git(userDir).commit(text[2]);
    let logResult = await git(userDir).log();
    let latestCommit = logResult.latest;
    chai.assert(!latestCommit.message.includes(text[2]));
    await fsWriteFile(`${userDir}/code.cpp`, text[2]);
    await GitHandler.add(username);
    await git(userDir).commit(text[2]);
    logResult = await git(userDir).log();
    latestCommit = logResult.latest;
    chai.assert(latestCommit.message.includes(text[2]));
  });

  it('test diff', async () => {
    let diff = await GitHandler.diff(username);
    chai.assert(diff === '');
    await fsWriteFile(`${userDir}/code.cpp`, text[3]);
    diff = await GitHandler.diff(username);
    chai.assert(diff !== '');
  });

  it('test diff staged', async () => {
    await fsWriteFile(`${userDir}/code.cpp`, text[4]);
    let diff = await GitHandler.diffStaged(username);
    chai.assert(diff === '');
    await git(userDir).init();
    await git(userDir).add('./*');
    diff = await GitHandler.diffStaged(username);
    chai.assert(diff !== '');
  });

  it('test commit', async () => {
    await fsWriteFile(`${userDir}/code.cpp`, text[5]);
    await git(userDir).init();
    await git(userDir).add('./*');
    await GitHandler.commit(username, text[5]);
    const logResult = await git(userDir).log();
    const latestCommit = logResult.latest;
    chai.assert(latestCommit.message.includes(text[5]));
  });

  it('test getFile', async () => {
    await fsWriteFile(`${userDir}/code.cpp`, text[6]);
    const log = await git(userDir).log();
    let file = await GitHandler.getFile(username, 'code.cpp', log.latest.hash);
    chai.assert(file === text[5]);
    file = await GitHandler.getFile(username);
    chai.assert(file === text[6]);
  });

  it('test setFile', async () => {
    await GitHandler.setFile(username, text[7]);
    const catResult = await shell.cat(`${userDir}/code.cpp`);
    const result = catResult.stdout;
    chai.assert(result === text[7]);
  });
});
