const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { Op } = require('sequelize');
const { check, validationResult } = require('express-validator/check');
const User = require('../models').user;

const router = express.Router();

router.post('/register', [
  check('username')
    .isAlphanumeric()
    .not().isEmpty(),
  check('password')
    .not().isEmpty(),
  check('email')
    .not().isEmpty()
    .isEmail(),
  check('fullName')
    .not().isEmpty(),
  check('country')
    .isAlpha(),
], async (req, res) => {
  const {
    username, password, email, country, fullName, pragyanId, repeatPassword,
  } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  if (password !== repeatPassword) {
    res.status(400).send('Passwords do not match');
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
