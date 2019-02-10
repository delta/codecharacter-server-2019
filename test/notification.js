process.env.NODE_ENV = 'test';

const chai = require('chai');
const request = require('supertest');

const shell = require('shelljs');
const server = require('../app');
const User = require('../api/models').user;
const Notification = require('../api/models').notification;
const CodeStatus = require('../api/models').codestatus;

// eslint-disable-next-line no-unused-vars
const should = chai.Should();
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
  // eslint-disable-next-line no-undef
  before(async () => {
    const registerBody = {
      username: 'notification_test',
      password: 'password',
      repeatPassword: 'password',
      email: 'notification@test.com',
      fullName: 'Notification',
      country: 'IN',
    };
    await superAgent.post('/user/register')
      .set('content-type', 'application/json')
      .send(registerBody);
  });
  beforeEach(async () => {
    const user = await User.findOne({
      where: {
        username: 'notification_test',
      },
    });
    const notificationResults = [];
    for (let index = 0; index < numEntries; index += 1) {
      const notification = Notification.findOrCreate({
        where: {
          id: index + 1,
          title: `notification_title_${index}`,
          content: `notification_content_${index}`,
          type: getType(index),
          userId: JSON.parse(JSON.stringify(user)).id,
        },
      });
      notificationResults.push(notification);
    }
    await Promise.all(notificationResults);
  });
  // eslint-disable-next-line no-undef
  after(async () => {
    const user = await User.findOne({
      where: {
        username: 'notification_test',
      },
    });
    await CodeStatus.destroy({
      where: {
        userId: user.id,
      },
    });
    const notificationResults = [];
    for (let index = 1; index <= numEntries; index += 1) {
      const notification = Notification.destroy({
        where: {
          id: index,
        },
      });
      notificationResults.push(notification);
    }
    await Promise.all(notificationResults);
    await user.destroy();
    const userDir = `${appPath}/storage/codes/${user.username}`;
    await shell.rm('-rf', userDir);
  });

  it('Test delete by id', async () => {
    const loginBody = {
      username: 'notification_test',
      password: 'password',
    };
    await superAgent.post('/user/login')
      .set('content-type', 'application/json')
      .send(loginBody);
    const user = await User.findOne({
      where: {
        username: 'notification_test',
      },
    });
    let notification = await Notification.findAll({
      where: {
        userId: JSON.parse(JSON.stringify(user)).id,
      },
    });
    chai.assert(JSON.parse(JSON.stringify(notification)).length === 20);
    const notificationResults = [];
    for (let index = 0; index < numEntries; index += 1) {
      const del = superAgent
        .delete(`/notifications/delete/${index + 1}`);
      notificationResults.push(del);
    }
    await Promise.all(notificationResults);
    notification = await Notification.findAll({
      where: {
        userId: JSON.parse(JSON.stringify(user)).id,
      },
    });
    JSON.parse(JSON.stringify(notification)).should.have.length(0);
  });

  it('Test Delete by Type', async () => {
    const loginBody = {
      username: 'notification_test',
      password: 'password',
    };
    await superAgent.post('/user/login')
      .set('content-type', 'application/json')
      .send(loginBody);
    const user = await User.findOne({
      where: {
        username: 'notification_test',
      },
    });
    const type = ['Info', 'Success', 'Error'];
    const delResults = [];
    for (let index = 0; index < 3; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      await superAgent.delete(`/notifications/delete/type/${type[index]}`);
      const del = Notification.findAll({
        where: {
          userId: JSON.parse(JSON.stringify(user)).id,
          type: type[index],
        },
      });
      delResults.push(del);
    }
    await Promise.all(delResults);
    for (let index = 0; index < 3; index += 1) {
      JSON.parse(JSON.stringify(delResults))[index].fulfillmentValue.should.have.length(0);
    }
  });
});
