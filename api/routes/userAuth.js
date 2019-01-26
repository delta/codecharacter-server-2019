const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { Op } = require('sequelize');
const { check, validationResult } = require('express-validator/check');
const User = require('../models').user;
const git = require('../utils/gitHandlers');

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
      type: 'Error',
      error: (errors.array())[0],
    });
  }

  if (password !== repeatPassword) {
    return res.status(400).json({
      type: 'Error',
      error: 'Passwords do not match',
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
        type: 'Error',
        error: 'Username/email already taken',
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
          type: 'Success',
          error: '',
        });
      }
    }

    return res.status(401).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

router.post('/login', async (req, res) => {
  await passport.authenticate('local', async (err, user) => {
    if (err) {
      return res.status(500).json({
        type: 'Error',
        error: 'Internal Server Error',
      });
    }
    if (!user) {
      return res.status(400).json({
        type: 'Error',
        error: 'Username does not exist',
      });
    }

    const loginErr = await new Promise((resolve) => {
      req.logIn(user, reqLoginErr => resolve(reqLoginErr));
    });

    if (loginErr) {
      return res.status(400).json({
        type: 'Error',
        error: 'Wrong Password',
      });
    }

    return res.status(200).json({
      type: 'Success',
      error: '',
    });
  })(req, res);
});

router.post('/logout', (req, res) => {
  req.logout();
  res.status(200).json({
    type: 'Success',
    error: '',
  });
});

router.get('/checkusername/:username', (req, res) => {
  const { username } = req.params;
  User.findAll({ where: { username } }).then((users) => {
    if (users.length) {
      res.status(200).json({
        type: 'Error',
        error: 'Username already exists',
      });
    }
    res.status(200).json({
      type: 'Success',
      error: '',
    });
  }).catch(() => {
    res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  });
});

module.exports = router;
