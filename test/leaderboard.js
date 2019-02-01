process.env.NODE_ENV = 'test';

const chai = require('chai');
// eslint-disable-next-line
const should = chai.should();
const chaiHttp = require('chai-http');
const request = require('supertest');

const server = require('../app');
const User = require('../api/models').user;
const Leaderboard = require('../api/models').leaderboard;

chai.use(chaiHttp);

describe('Test Leaderboard', async () => {
  describe('Test Leaderboard by Rank', async () => {
    const superAgent = request.agent(server);
    // eslint-disable-next-line no-undef
    before(async () => {
      const numEntries = 10;
      const registerBody = {
        username: 'testusername',
        password: 'testpassword',
        repeatPassword: 'testpassword',
        email: 'testemail@test.com',
        country: 'IN',
        fullName: 'Mocha Test',
        pragyanId: null,
      };
      await superAgent.post('/user/register')
        .set('content-type', 'application/json')
        .send(registerBody);
      const loginBody = {
        username: 'testusername',
        password: 'testpassword',
      };
      await superAgent.post('/user/login')
        .set('content-type', 'application/json')
        .send(loginBody);
      for (let index = 0; index < numEntries; index += 1) {
        User.findOrCreate({
          where: {
            username: `testusername${index}`,
            password: `testpassword${index}`,
            email: `testemail${index}@testemail.com`,
            fullName: `Mocha${index}`,
            id: 100 + index,
          },
        });
      }
      for (let index = 0; index < numEntries; index += 1) {
        User.findOrCreate({
          where: {
            username: `z${index + 10}`,
            password: `z${index + 10}`,
            email: `z${index + 10}@testemail.com`,
            fullName: `z${index + 10}`,
            id: 110 + index,
          },
        });
      }
      for (let index = 0; index < numEntries; index += 1) {
        Leaderboard.findOrCreate({
          where: {
            user_id: 100 + index,
            rating: 100 * index,
            dll1: `dll1${index}`,
            dll2: `dll2${index}`,
          },
        });
      }
      for (let index = 0; index < numEntries; index += 1) {
        Leaderboard.findOrCreate({
          where: {
            user_id: 110 + index,
            rating: 100 * index + 50,
            dll1: `dll1${index}`,
            dll2: `dll2${index}`,
          },
        });
      }
    });

    it('start must be int', async () => {
      const start = 'a';
      const finish = 1;
      const { res } = await superAgent
        .post(`/leaderboard/${start}/${finish}`);

      res.should.have.status(400);
      chai.assert(JSON.parse(res.text).error.msg === 'Start must be Integer');
    });

    it('finish must be int', async () => {
      const start = 0;
      const finish = 'a';
      const { res } = await superAgent
        .post(`/leaderboard/${start}/${finish}`);
      res.should.have.status(400);
      chai.assert(JSON.parse(res.text).error.msg === 'Finish must be Integer');
    });

    it('send 200 (Rank 1)', async () => {
      const start = 1;
      const finish = 1;
      const { res } = await superAgent
        .post(`/leaderboard/${start}/${finish}`);
      res.should.have.status(200);
    });

    it('send 200 (Ranks 5-10)', async () => {
      const start = 5;
      const finish = 10;
      const { res } = await superAgent
        .post(`/leaderboard/${start}/${finish}`);
      res.should.have.status(200);
      const leaderboardData = JSON.parse(JSON.parse(res.text).leaderboardData);
      for (let index = 0; index < leaderboardData.length; index += 1) {
        chai.assert(leaderboardData[index].rank === start + index);
      }
    });

    it('send 200 (Ranks 1-100)', async () => {
      const start = 1;
      const finish = 100;
      const numEntries = 20;
      const { res } = await superAgent
        .post(`/leaderboard/${start}/${finish}`);
      res.should.have.status(200);
      const leaderboardData = JSON.parse(JSON.parse(res.text).leaderboardData);
      chai.assert(leaderboardData.length === numEntries);
      for (let index = 0; index < numEntries; index += 1) {
        chai.assert(leaderboardData[index].rank === start + index);
      }
    });
  });

  describe('Test Leaderboard by Search', async () => {
    const searchKey = 'z';
    const superAgent = request.agent(server);
    // eslint-disable-next-line no-undef
    before(async () => {
      const registerBody = {
        username: 'testusername',
        password: 'testpassword',
        repeatPassword: 'testpassword',
        email: 'testemail@test.com',
        country: 'IN',
        fullName: 'Mocha Test',
        pragyanId: null,
      };
      await superAgent.post('/user/register')
        .set('content-type', 'application/json')
        .send(registerBody);
      const loginBody = {
        username: 'testusername',
        password: 'testpassword',
      };
      await superAgent.post('/user/login')
        .set('content-type', 'application/json')
        .send(loginBody);
    });

    it(`send 200 (Search '${searchKey}')`, async () => {
      const start = 1;
      const finish = 100;
      const numEntries = 10;
      const { res } = await superAgent
        .post(`/leaderboard/${searchKey}/${start}/${finish}`);
      res.should.have.status(200);
      const leaderboardData = JSON.parse(JSON.parse(res.text).leaderboardData);
      chai.assert(leaderboardData.length === numEntries);
      for (let index = 0; index < numEntries; index += 1) {
        chai.assert(leaderboardData[index].rank === 2 + index * 2);
      }
    });
  });
});
