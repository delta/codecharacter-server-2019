process.env.NODE_ENV = 'test';

const chai = require('chai');
// eslint-disable-next-line
const should = chai.should();
const request = require('supertest');
const randomString = require('randomstring');

const server = require('../app');
const User = require('../api/models').user;
const Match = require('../api/models').match;
const CodeStatus = require('../api/models').codestatus;

const parsify = obj => JSON.parse(JSON.stringify(obj));

describe('Test Match', async () => {
  const superAgent = request.agent(server);
  const numEntires = 10;
  let registerResults = [];
  let userIdResults = [];
  // eslint-disable-next-line no-undef
  before(async () => {
    for (let index = 0; index < numEntires; index += 1) {
      const username = `${randomString.generate(10)}Match`;
      const registerBody = {
        username,
        password: 'testpassword',
        repeatPassword: 'testpassword',
        email: `${username}@test.com`,
        country: 'IN',
        fullName: 'Mocha Test',
        pragyanId: null,
      };
      const registerResult = superAgent.post('/user/register')
        .set('content-type', 'application/json')
        .send(registerBody);
      registerResults.push(registerResult);
    }
    await Promise.all(registerResults);
    registerResults = parsify(registerResults);
    for (let index = 0; index < numEntires; index += 1) {
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
    for (let index = 0; index < numEntires - 1; index += 1) {
      const match = Match.findOrCreate({
        where: {
          userId1: userIdResults[index].fulfillmentValue.id,
          userId2: userIdResults[index + 1].fulfillmentValue.id,
          verdict: null,
          score1: 0,
          score2: 0,
          createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      });
      matches.push(match);
    }
    for (let index = 0; index < numEntires - 1; index += 1) {
      const match = Match.findOrCreate({
        where: {
          userId1: userIdResults[index].fulfillmentValue.id,
          userId2: userIdResults[index + 1].fulfillmentValue.id,
          verdict: null,
          score1: 0,
          score2: 0,
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
    for (let index = 0; index < numEntires - 1; index += 1) {
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
    for (let index = 0; index < numEntires; index += 1) {
      const code = CodeStatus.destroy({
        where: {
          userId: userIdResults[index].fulfillmentValue.id,
        },
      });
      codeStatusResults.push(code);
    }
    await Promise.all(codeStatusResults);
    const userResults = [];
    for (let index = 0; index < numEntires; index += 1) {
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
    let matchResult = [];
    for (let index = 0; index < getData.length; index += 1) {
      const match = Match.findOne({
        where: {
          userId1: getData[index].userId1,
          userId2: getData[index].userId2,
        },
      });
      matchResult.push(match);
    }
    await Promise.all(matchResult);
    matchResult = parsify(matchResult);
    matchResult.length.should.equal(getData.length);
  });
});