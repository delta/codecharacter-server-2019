process.env.NODE_ENV = 'test';
const chai = require('chai');
// eslint-disable-next-line
const should = chai.should();
const shell = require('shelljs');
const request = require('supertest');
const User = require('../api/models').user;
const server = require('../app');


async function userLogin(userAgent, userDetails) {
  const { username, password } = userDetails;
  return userAgent.post('/user/login')
    .set('content-type', 'application/json')
    .send({ username, password });
}

async function createUser(userAgent) {
  const body = {
    username: 'testusername',
    password: 'testpassword',
    repeatPassword: 'testpassword',
    email: 'testemail@test.com',
    country: 'IN',
    fullName: 'Mocha Test',
    pragyanId: null,
  };
  await userAgent.post('/user/register')
    .set('content-type', 'application/json')
    .send(body);
  return body;
}

async function deleteCreatedUser(body, userAgent) {
  await userAgent.post('/user/logout')
    .send();
  const user = await User.findOne({
    where: {
      username: body.username,
    },
  });
  await user.destroy();
  const userDir = `${appPath}/storage/codes/${user.username}`;
  await shell.rm('-rf', userDir);
}

describe('Profile route middlware check', () => {
  it('should fail if user is not logged in', async () => {
    const { res } = await chai.request(server)
      .get('/user/profile');

    res.should.have.status(401);
    JSON.parse(res.text).error.should.equal('Unauthorised');
  });
});

describe('Current user profile', () => {
  let body;
  const userAgent = request.agent(server);
  beforeEach(async () => {
    body = await createUser(userAgent);
    await userLogin(userAgent, body);
  });

  it('should send current user details', async () => {
    const { res } = await userAgent.get('/user/profile');
    res.should.have.status(200);
    chai.assert(JSON.parse(res.text).error === '');
    JSON.parse(res.text).userDetails.should.eql({
      username: body.username,
      fullName: body.fullName,
      country: body.country,
    });
  });

  afterEach(async () => {
    await deleteCreatedUser(body, userAgent);
  });
});

describe('Other user profile', async () => {
  let body;
  const userAgent = request.agent(server);
  let secondUser;
  beforeEach(async () => {
    body = await createUser(userAgent);
    await userLogin(userAgent, body);
    secondUser = {
      username: 'testusername2',
      password: 'testpassword',
      repeatPassword: 'testpassword',
      email: 'testemail2@test.com',
      country: 'IN',
      fullName: 'Mocha Test2',
      pragyanId: null,
    };
    await userAgent.post('/user/register')
      .set('content-type', 'application/json')
      .send(secondUser);
  });

  it('should send other user details', async () => {
    const { res } = await userAgent.get(`/user/profile/view/${secondUser.username}`);
    res.should.have.status(200);
    chai.assert(JSON.parse(res.text).error === '');
    JSON.parse(res.text).userDetails.should.eql({
      username: secondUser.username,
      fullName: secondUser.fullName,
      country: secondUser.country,
    });
  });

  it('should return no user on missing username', async () => {
    const { res } = await userAgent.get('/user/profile/view/usernameWhichNooneWillUse');
    res.should.have.status(400);
    JSON.parse(res.text).type.should.equal('Error');
    JSON.parse(res.text).error.should.equal('User does not exist');
  });

  afterEach(async () => {
    await deleteCreatedUser(body, userAgent);
    await userAgent.post('/user/logout')
      .send();
    const user = await User.findOne({
      where: {
        username: secondUser.username,
      },
    });
    await user.destroy();
    const userDir = `${appPath}/storage/codes/${secondUser.username}`;
    await shell.rm('-rf', userDir);
  });
});

describe('Update user', async () => {
  let body;
  const userAgent = request.agent(server);
  beforeEach(async () => {
    body = await createUser(userAgent);
    await userLogin(userAgent, body);
  });

  it('should update user', async () => {
    const updateDetails = {
      username: 'testusername2',
      email: 'testemail2@test.com',
      country: 'IN',
      fullName: 'Mocha Test2',
    };
    const { res } = await userAgent.post('/user/profile/update')
      .set('content-type', 'application/json')
      .send(updateDetails);
    res.should.have.status(200);
    JSON.parse(res.text).error.should.equal('');
    const updatedUser = await User.findOne({
      where: {
        username: updateDetails.username,
      },
    });
    body = updatedUser;
    Object.keys(updateDetails)
      .map(key => updateDetails[key] === updatedUser[key])
      .should.not.include(false);
  });

  afterEach(async () => {
    await deleteCreatedUser(body, userAgent);
  });
});

describe('Update password', async () => {
  let body;
  const userAgent = request.agent(server);
  beforeEach(async () => {
    body = await createUser(userAgent);
    await userLogin(userAgent, body);
  });
  const newPassword = 'new password';
  it('should send 400 if old password is not given', async () => {
    const { res } = await userAgent.post('/user/profile/updatePassword')
      .set('content-type', 'application/json')
      .send({ password: newPassword });
    res.should.have.status(400);
    JSON.parse(res.text).error.should.equal('Old password missing');
  });

  it('should send 400 if old password is wrong', async () => {
    const wrongOldPassword = 'wrongpassword';
    const { res } = await userAgent.post('/user/profile/updatePassword')
      .set('content-type', 'application/json')
      .send({ password: newPassword, oldPassword: wrongOldPassword });
    res.should.have.status(400);
    JSON.parse(res.text).error.should.equal('Wrong password given');
  });

  it('should send 400 if new password is blank', async () => {
    const { res } = await userAgent.post('/user/profile/updatePassword')
      .set('content-type', 'application/json')
      .send({ password: '', oldPassword: body.password });
    res.should.have.status(400);
    JSON.parse(res.text).error.should.equal('Password cannot be blank');
  });

  it('should update password and send 200', async () => {
    const { res } = await userAgent.post('/user/profile/updatePassword')
      .set('content-type', 'application/json')
      .send({ password: newPassword, oldPassword: body.password });
    res.should.have.status(200);
    JSON.parse(res.text).type.should.equal('Success');
    // Login with new password
    const loginCredentials = {
      username: body.username,
      password: newPassword,
    };
    const loginResponse = await userLogin(userAgent, loginCredentials);
    loginResponse.should.have.status(200);
    JSON.parse(loginResponse.text).type.should.equal('Success');
  });
  afterEach(async () => {
    await deleteCreatedUser(body, userAgent);
  });
});
