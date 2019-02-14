process.env.NODE_ENV = 'test';

const chai = require('chai');
// eslint-disable-next-line
const should = chai.should();
const request = require('supertest');
const randomString = require('randomstring');
const { Op } = require('sequelize');

const server = require('../app');
const User = require('../api/models').user;
const Match = require('../api/models').match;
const CodeStatus = require('../api/models').codestatus;

const parsify = obj => JSON.parse(JSON.stringify(obj));

describe('Test Match', async () => {
  const superAgent = request.agent(server);
  const numEntries = 10;
  let registerResults = [];
  let userIdResults = [];
  // eslint-disable-next-line no-undef
  before(async () => {
    for (let index = 0; index < numEntries; index += 1) {
      const username = `${randomString.generate(10)}Match`;
      const registerBody = {
        username,
        password: 'testpassword',
        repeatPassword: 'testpassword',
        email: `${username}@test.com`,
        country: 'IN',
        fullName: 'Mocha Test',
        pragyanId: null,
        type: 'Professional',
      };
      const registerResult = superAgent.post('/user/register')
        .set('content-type', 'application/json')
        .send(registerBody);
      registerResults.push(registerResult);
    }
    await Promise.all(registerResults);
    registerResults = parsify(registerResults);
    for (let index = 0; index < numEntries; index += 1) {
      const user = User.findOne({
        where: {
          username: registerResults[index].data.username,
        },
      });
      userIdResults.push(user);
    }
    await Promise.all(userIdResults);
    userIdResults = parsify(userIdResults);
    let matches = [];
    for (let index = 0; index < numEntries - 1; index += 1) {
      const match = Match.findOrCreate({
        where: {
          userId1: userIdResults[index].fulfillmentValue.id,
          userId2: userIdResults[index + 1].fulfillmentValue.id,
          verdict: null,
          score1: Math.random() * 2,
          score2: Math.random() * 2,
          createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      });
      matches.push(match);
    }
    for (let index = 0; index < numEntries - 1; index += 1) {
      const match = Match.findOrCreate({
        where: {
          userId1: userIdResults[index].fulfillmentValue.id,
          userId2: userIdResults[index + 1].fulfillmentValue.id,
          verdict: null,
          score1: Math.random() * 2,
          score2: Math.random() * 2,
          createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      });
      matches.push(match);
    }
    await Promise.all(matches);
    matches = parsify(matches);
  });
  // eslint-disable-next-line no-undef
  after(async () => {
    const matchResults = [];
    for (let index = 0; index < numEntries - 1; index += 1) {
      const match = Match.destroy({
        where: {
          userId1: userIdResults[index].fulfillmentValue.id,
          userId2: userIdResults[index + 1].fulfillmentValue.id,
        },
      });
      matchResults.push(match);
    }
    await Promise.all(matchResults);
    const codeStatusResults = [];
    for (let index = 0; index < numEntries; index += 1) {
      const code = CodeStatus.destroy({
        where: {
          userId: userIdResults[index].fulfillmentValue.id,
        },
      });
      codeStatusResults.push(code);
    }
    await Promise.all(codeStatusResults);
    const userResults = [];
    for (let index = 0; index < numEntries; index += 1) {
      const user = User.destroy({
        where: {
          id: userIdResults[index].fulfillmentValue.id,
        },
      });
      userResults.push(user);
    }
    await Promise.all(userResults);
  });

  it('Test Get All Matches', async () => {
    const loginBody = {
      username: registerResults[0].data.username,
      password: 'testpassword',
    };
    await superAgent.post('/user/login')
      .set('content-type', 'application/json')
      .send(loginBody);
    let getData = await superAgent.get('/match/all');
    getData = JSON.parse(parsify(parsify(getData).text)).matchData;
    const user = await User.findOne({
      where: {
        username: registerResults[0].data.username,
      },
    });
    let matchResult = [];
    const match = await Match.findAll({
      where: {
        [Op.or]: [{
          userId1: user.id,
        }, {
          userId2: user.id,
        }],
      },
    });
    matchResult = parsify(match);
    matchResult.length.should.equal(getData.length);
  });
});
