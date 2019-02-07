process.env.NODE_ENV = 'test';

const chai = require('chai');
// eslint-disable-next-line
const should = chai.should();
const chaiHttp = require('chai-http');
const request = require('supertest');

const server = require('../app');
const User = require('../api/models').user;
const Notification = require('../api/models').notification;

chai.use(chaiHttp);

describe('Test Notification', async () => {
  const superAgent = request.agent(server);
  const numEntries = 20;
  // eslint-disable-next-line no-undef
  before(async () => {
    for (let index = 0; index < numEntries; index += 1) {
      // eslint-disable-next-line no-unused-vars
      const registerBody = {
        username: `notification_test_${index}`,
        password: 'password',
        repeatPassword: 'password',
        email: `notification${index}@test.com`,
        fullName: 'Notification',
        country: 'IN',
      };
      // eslint-disable-next-line no-await-in-loop
      await superAgent.post('/user/register')
        .set('content-type', 'application/json')
        .send(registerBody);
    }
  });
  beforeEach(async () => {
    for (let index = 0; index < numEntries; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      const user = await User.findOne({
        where: {
          username: `notification_test_${index}`,
        },
      });

      // eslint-disable-next-line no-await-in-loop
      await Notification.findOrCreate({
        where: {
          id: user.id,
          title: `notification_title_${index}`,
          content: `notification_content_${index}`,
          // eslint-disable-next-line no-nested-ternary
          type: (index < 5) ? 'Info' : (index < 10) ? 'Success' : 'Error',
          userId: user.id,
        },
      });
    }
  });
  // eslint-disable-next-line no-undef
  after(async () => {
    for (let index = 0; index < numEntries; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      const user = await User.findOne({
        where: {
          username: `notification_test_${index}`,
        },
      });
      // eslint-disable-next-line no-await-in-loop
      await user.destroy();
    }
  });
  it('Test delete by id', async () => {
    for (let index = 0; index < numEntries; index += 1) {
      const loginBody = {
        username: `notification_test_${index}`,
        password: 'password',
      };

      // eslint-disable-next-line no-await-in-loop
      await superAgent.post('/user/login')
        .set('content-type', 'application/json')
        .send(loginBody);

      // eslint-disable-next-line no-await-in-loop
      const user = await User.findOne({
        where: {
          username: `notification_test_${index}`,
        },
      });
      // eslint-disable-next-line no-await-in-loop
      const { res } = await superAgent
        .delete(`/notifications/delete/${user.id}`);

      res.should.have.status(200);
    }
  });

  it('Test Delete by Type', async () => {
    let type = 'Info';
    for (let index = 0; index < numEntries; index += 1) {
      // eslint-disable-next-line no-nested-ternary
      type = (index < 5) ? 'Info' : (index < 10) ? 'Success' : 'Error';
      const loginBody = {
        username: `notification_test_${index}`,
        password: 'password',
      };
      // eslint-disable-next-line no-await-in-loop
      await superAgent.post('/user/login')
        .set('content-type', 'application/json')
        .send(loginBody);

      // eslint-disable-next-line no-await-in-loop
      const { res } = await superAgent.delete(`/notifications/delete/type/${type}`);
      res.should.have.status(200);
    }
  });
});
