process.env.NODE_ENV = 'test';

const chai = require('chai');
// eslint-disable-next-line
const should = chai.should();
const shell = require('shelljs');
const chaiHttp = require('chai-http');
const request = require('supertest');
const randomString = require('randomstring');

const codeStatus = require('../api/models').codestatus;
const server = require('../app');
const User = require('../api/models').user;

chai.use(chaiHttp);

describe('Test Register', async () => {
  let body;

  beforeEach(async () => {
    const username = randomString.generate(15);
    body = {
      username,
      password: 'testpassword',
      repeatPassword: 'testpassword',
      email: `${username}@test.com`,
      country: 'IN',
      fullName: 'Register_Mocha Test',
      pragyanId: null,
      type: 'Professional',
    };
  });
  it('send 200', async () => {
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(body);
    res.should.have.status(200);

    const user = await User.findOne({
      where: {
        username: body.username,
      },
    });
    const code = await codeStatus.findOne({
      where: {
        userId: user.id,
      },
    });
    await code.destroy();
    await user.destroy();

    const userDir = `${appPath}/storage/codes/${user.username}`;
    await shell.rm('-rf', userDir);
  });

  it('send 400 (Empty username)', async () => {
    body.username = '';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(body);

    res.should.have.status(400);
  });

  it('send 400 (Empty email)', async () => {
    body.email = '';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(body);
    JSON.parse(res.text).error.should.equal('Email cannot be empty');
    res.should.have.status(400);
  });

  it('send 400 (Empty type)', async () => {
    body.type = null;
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(body);
    res.should.have.status(400);
    JSON.parse(res.text).error.should.equal('Type can not be empty');
  });

  it('send 400 (Invalid type)', async () => {
    body.type = 'invalid type';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(body);
    res.should.have.status(400);
    JSON.parse(res.text).error.should.equal('Type should be either Student or Professional');
  });

  it('send 400 (College missing for student)', async () => {
    body.type = 'Student';
    body.student = '';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(body);
    res.should.have.status(400);
    JSON.parse(res.text).error.should.equal('College is required for type student');
  });

  it('send 400 (Already taken username)', async () => {
    await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(body);

    const duplicateBody = body;
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(duplicateBody);

    res.should.have.status(400);
    JSON.parse(res.text).error.should.equal('Username/email already taken');
    const user = await User.findOne({
      where: {
        username: body.username,
      },
    });
    const code = await codeStatus.findOne({
      where: {
        userId: user.id,
      },
    });
    await code.destroy();
    await user.destroy();
    const userDir = `${appPath}/storage/codes/${user.username}`;
    await shell.rm('-rf', userDir);
  });

  it('send 400 (Empty password)', async () => {
    body.password = '';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(body);

    res.should.have.status(400);
    JSON.parse(res.text).error.should.equal('Password cannot be empty');
  });

  it('send 400 (Not matching passwords)', async () => {
    body.repeatPassword = 'wrongpassword';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(body);
    res.should.have.status(400);
    JSON.parse(res.text).error.should.equal('repeatPassword field must have the same value as the password field');
  });

  it('send 400 (Invalid Email)', async () => {
    body.email = '@@##!!';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(body);
    res.should.have.status(400);
    JSON.parse(res.text).error.should.equal('Invalid Email');
  });
});

describe('Test Login', async () => {
  let credentials;
  const registerBody = {
    username: 'username',
    password: 'password',
    repeatPassword: 'password',
    email: 'email@test.com',
    country: 'IN',
    fullName: 'Mocha',
    pragyanId: null,
    type: 'Professional',
  };
  // eslint-disable-next-line no-undef
  before(async () => {
    await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(registerBody);
  });
  // eslint-disable-next-line no-undef
  after(async () => {
    const user = await User.findOne({
      where: {
        username: registerBody.username,
      },
    });
    const code = await codeStatus.findOne({
      where: {
        userId: user.id,
      },
    });
    await code.destroy();
    await user.destroy();
    const userDir = `${appPath}/storage/codes/${user.username}`;
    await shell.rm('-rf', userDir);
  });
  beforeEach(async () => {
    credentials = {
      username: 'username',
      password: 'password',
    };
  });

  it('send 400 (Wrong Password)', async () => {
    credentials.password = 'wrongPassword';
    const { res } = await chai.request(server)
      .post('/user/login')
      .set('content-type', 'application/json')
      .send(credentials);

    chai.assert(JSON.parse(res.text).error === 'Wrong password');
    res.should.have.status(400);
  });

  it('send 400 (Username not found)', async () => {
    credentials.username = 'wrongUsername';
    const { res } = await chai.request(server)
      .post('/user/login')
      .set('content-type', 'application/json')
      .send(credentials);

    chai.assert(JSON.parse(res.text).error === 'Username not found');
    res.should.have.status(400);
  });

  it('send 200', async () => {
    const { res } = await chai.request(server)
      .post('/user/login')
      .set('content-type', 'application/json')
      .send(credentials);

    res.should.have.status(200);
    chai.assert(JSON.parse(res.text).error === '');
  });
});

describe('Test Logout', async () => {
  const userAgent = request.agent(server);
  const credentials = {
    username: 'username',
    password: 'password',
  };
  const registerBody = {
    username: 'username',
    password: 'password',
    repeatPassword: 'password',
    email: 'email@test.com',
    country: 'IN',
    fullName: 'Mocha',
    pragyanId: null,
    type: 'Professional',
  };
  // eslint-disable-next-line no-undef
  before(async () => {
    await userAgent.post('/user/register')
      .set('content-type', 'application/json')
      .send(registerBody);
  });
  // eslint-disable-next-line no-undef
  after(async () => {
    const user = await User.findOne({
      where: {
        username: registerBody.username,
      },
    });
    const code = await codeStatus.findOne({
      where: {
        userId: user.id,
      },
    });
    await code.destroy();
    await user.destroy();
    const userDir = `${appPath}/storage/codes/${user.username}`;
    await shell.rm('-rf', userDir);
  });
  it('send 200', async () => {
    await userAgent.post('/user/login')
      .set('content-type', 'application/json')
      .send(credentials);
    const { res } = await userAgent
      .post('/user/logout')
      .send();

    res.should.have.status(200);
  });
});

describe('Test Check Username', async () => {
  const wrongUsername = 'wrongUsername';
  const correctUsername = 'username';
  const registerBody = {
    username: correctUsername,
    password: 'password',
    repeatPassword: 'password',
    email: 'email@test.com',
    country: 'IN',
    fullName: 'Mocha',
    pragyanId: null,
    type: 'Professional',
  };
  // eslint-disable-next-line no-undef
  before(async () => {
    await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/json')
      .send(registerBody);
  });
  // eslint-disable-next-line no-undef
  after(async () => {
    const user = await User.findOne({
      where: {
        username: correctUsername,
      },
    });
    const code = await codeStatus.findOne({
      where: {
        userId: user.id,
      },
    });
    await code.destroy();
    await user.destroy();
    const userDir = `${appPath}/storage/codes/${user.username}`;
    await shell.rm('-rf', userDir);
  });
  it('send Error', async () => {
    const { res } = await chai.request(server)
      .get(`/user/checkusername/${wrongUsername}`);

    res.should.have.status(200);
    chai.assert(JSON.parse(res.text).error === '');
  });

  it('send Success', async () => {
    const { res } = await chai.request(server)
      .get(`/user/checkusername/${correctUsername}`);

    res.should.have.status(200);
    chai.assert(JSON.parse(res.text).error !== '');
  });
});
