const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { Op } = require('sequelize');
const { check, validationResult } = require('express-validator/check');
const User = require('../models').user;
const git = require('../utils/git_handlers');

const router = express.Router();

router.post('/register', [
  check('username')
    .not().isEmpty().withMessage('Username cannot be empty'),
  check('password')
    .not().isEmpty().withMessage('Password cannot be empty'),
  check('repeatPassword')
    .not().isEmpty().withMessage('Password cannot be empty'),
  check('email')
    .not().isEmpty().withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Invalid Email'),
  check('fullName')
    .not().isEmpty().withMessage('Full Name cannot be empty'),
  check('country')
    .isAlpha(),
], async (req, res) => {
  const {
    username, password, email, country, fullName, pragyanId, repeatPassword,
  } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: errors.array(),
    });
  }

  if (password !== repeatPassword) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: ['Passwords do not match'],
    });
  }

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (user) {
      return res.status(400).json({
        message: 'Username/email already taken',
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      fullName,
      country: country || 'IN',
      pragyanId: pragyanId || null,
      password: passwordHash,
    });

    if (newUser) {
      if (await git.createUserDir(username)) {
        return res.status(200).json({
          message: 'Registration Successful!',
        });
      }
    }

    return res.status(401).json({
      message: 'Error',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Internal Server Error',
      errors: err,
    });
  }
});

router.post('/login', async (req, res) => {
  await passport.authenticate('local', (err, user) => {
    if (err) {
      return res.status(500).json({
        message: 'Internal Server Error',
      });
    }
    if (!user) {
      return res.status(200).json({
        message: 'Username does not exist',
      });
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.status(400).json({
          message: 'Wrong Password',
        });
      }
      return res.status(200).json({
        message: 'Login Successful',
      });
    });

    return res.status(500).json({
      message: 'Internal Server Error',
    });
  })(req, res);
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
