process.env.NODE_ENV = 'test';

const chai = require('chai');
const request = require('supertest');

const randomString = require('randomstring');
const gitHandlers = require('../api/utils/gitHandlers');
const server = require('../app');
const User = require('../api/models').user;
const Notification = require('../api/models').notification;
const CodeStatus = require('../api/models').codestatus;

// eslint-disable-next-line no-unused-vars
const should = chai.should();
describe('Test Notification', async () => {
  const superAgent = request.agent(server);
  const numEntries = 20;
  const getType = (index) => {
    if (index < 5) {
      return 'Info';
    }
    if (index < 10) {
      return 'Success';
    }
    return 'Error';
  };
  const registerBody = {
    username: randomString.generate(15),
    password: 'password',
    repeatPassword: 'password',
    email: 'notification@test.com',
    fullName: 'Notification',
    country: 'IN',
    type: 'Professional',
  };
  let user;
  // eslint-disable-next-line no-undef
  before(async () => {
    await superAgent.post('/user/register')
      .set('content-type', 'application/json')
      .send(registerBody);
  });
  beforeEach(async () => {
    user = await User.findOne({
      where: {
        username: registerBody.username,
      },
    });
    const notificationResults = [];
    for (let index = 0; index < numEntries; index += 1) {
      const notification = Notification.findOrCreate({
        where: {
          id: index + 1,
          title: `notification_title_${index}`,
          content: `notification_content_${index}`,
          group: getType(index),
          userId: user.id,
          category: 'PERSONAL',
        },
      });
      notificationResults.push(notification);
    }
    await Promise.all(notificationResults);
  });
  // eslint-disable-next-line no-undef
  after(async () => {
    await CodeStatus.destroy({
      where: {
        userId: user.id,
      },
    });
    const notificationResults = [];
    for (let index = 1; index <= numEntries; index += 1) {
      const notification = Notification.destroy({
        where: {
          userId: user.id,
        },
      });
      notificationResults.push(notification);
    }
    await Promise.all([
      ...notificationResults,
      user.destroy(),
      gitHandlers.removeDir(registerBody.username),
      gitHandlers.removeLeaderboardDir(registerBody.username),
    ]);
  });

  it('Test delete by id', async () => {
    const loginBody = {
      username: registerBody.username,
      password: registerBody.password,
    };
    await superAgent.post('/user/login')
      .set('content-type', 'application/json')
      .send(loginBody);
    let notification = await Notification.findAll({
      where: {
        userId: user.id,
      },
    });
    notification.should.have.length(20);
    const notificationResults = [];
    for (let index = 0; index < numEntries; index += 1) {
      const del = superAgent
        .delete(`/notifications/delete/${index + 1}`);
      notificationResults.push(del);
    }
    await Promise.all(notificationResults);
    notification = await Notification.findAll({
      where: {
        userId: user.id,
      },
    });
    notification.should.have.length(0);
  });

  it('Test Delete by Type', async () => {
    const loginBody = {
      username: registerBody.username,
      password: registerBody.password,
    };
    await superAgent.post('/user/login')
      .set('content-type', 'application/json')
      .send(loginBody);
    const group = ['Info', 'Success', 'Error'];
    const delPromises = [];
    for (let index = 0; index < 3; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      await superAgent.delete(`/notifications/delete/type/${group[index]}`);
      const del = Notification.findAll({
        where: {
          userId: user.id,
          group: group[index],
        },
      });
      delPromises.push(del);
    }
    const delResults = await Promise.all(delPromises);
    for (let i = 0; i < 3; i += 1) {
      delResults[i].should.have.length(0);
    }
  });
});
