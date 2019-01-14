const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { Op } = require('sequelize');
const validator = require('validator');
const User = require('../models').user;

const router = express.Router();

router.post('/register', async (req, res) => {
  const {
    username, password, email, country, fullName, pragyanId, repeatPassword,
  } = req.body;

  if (!validator.isAlphanumeric(username) || validator.isEmpty(username)) {
    res.status(400).send('Username must be non empty alphanumeric string');
    return;
  }

  if (validator.isEmpty(password)) {
    res.status(400).send('Password cannot be empty');
    return;
  }

  if (password !== repeatPassword) {
    res.status(400).send('Passwords do not match');
    return;
  }

  if (validator.isEmpty(email) || !validator.isEmail(email)) {
    res.status(400).send('Invalid Email');
    return;
  }

  if (validator.isEmpty(fullName)) {
    res.status(400).send('Invalid Email');
    return;
  }

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (user) {
      res.status(400).send('Username / Email already exists');
      return;
    }
  } catch (err) {
    res.status(500);
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      fullName,
      country: country || 'IN',
      pragyanId: pragyanId || null,
      password: passwordHash,
    });

    res.sendStatus(200).send('User created');
  } catch (err) {
    res.status(500);
  }
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  if (req.user) {
    res.sendStatus(200);
  }
});

router.post('/logout', (req, res) => {
  req.logout();
  res.sendStatus(200);
});

router.get('/checkusername/:username', (req, res) => {
  const { username } = req.params;
  User.findAll({ where: { username } }).then((users) => {
    res.send(!!users.length);
  }).catch((err) => {
    res.send(err);
  });
});

module.exports = router;
