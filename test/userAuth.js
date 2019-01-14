process.env.NODE_ENV = 'test';

const chai = require('chai');
// eslint-disable-next-line
const should = chai.should();
const chaiHttp = require('chai-http');

const server = require('../app');
const User = require('../api/models').user;

chai.use(chaiHttp);

describe('Test Register', async () => {
  let body;

  beforeEach(() => {
    body = {
      username: 'testusername',
      password: 'testpassword',
      repeatPassword: 'testpassword',
      email: 'testemail@test.com',
      country: 'IN',
      fullName: 'Mocha Test',
      pragyanId: null,
    };
  });

  it('send 200', async () => {
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(body);

    res.should.have.status(200);

    const user = await User.findOne({
      where: {
        username: body.username,
      },
    });

    await user.destroy();
  });

  it('send 400 (Empty username)', async () => {
    body.username = '';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(body);

    res.should.have.status(400);
  });

  it('send 400 (Empty email)', async () => {
    body.email = '';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(body);

    res.should.have.status(400);
  });

  it('send 400 (Already taken username)', async () => {
    await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(body);

    const duplicateBody = body;
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(duplicateBody);

    res.should.have.status(400);

    const user = await User.findOne({
      where: {
        username: body.username,
      },
    });

    await user.destroy();
  });

  it('send 400 (Empty password)', async () => {
    body.password = '';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(body);

    res.should.have.status(400);
  });

  it('send 400 (Not matching passwords)', async () => {
    body.repeatPassword = 'wrongpassword';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(body);

    res.should.have.status(400);
  });

  it('send 400 (Invalid Email)', async () => {
    body.email = '@@##!!';
    const { res } = await chai.request(server)
      .post('/user/register')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(body);

    res.should.have.status(400);
  });
});
