const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { Op } = require('sequelize');
const { check, validationResult } = require('express-validator/check');
const User = require('../models').user;
const codeStatus = require('../models').codestatus;
const git = require('../utils/gitHandlers');
const socket = require('../utils/socketHandlers');
const isLoggedIn = require('../middlewares/isLoggedIn');

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
        await codeStatus.create({
          userId: newUser.id,
          latestSrcPath: `${git.getUserDir(username)}/code.cpp`,
        });
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

router.post('/login', async (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({
        type: 'Error',
        error: 'Internal server error',
      });
    }
    if (!user) {
      return res.status(400).json({
        type: 'Error',
        error: info,
      });
    }

    req.logIn(user, (error) => {
      if (error) {
        return res.status(500).json({
          type: 'Error',
          error: 'Internal server error',
        });
      }
      res.cookie('userId', user.id);
      return res.status(200).json({
        type: 'Success',
        error: '',
      });
    });

    return null; // coz eslint forces to have a return at the end
  })(req, res, next);
});

router.get('/checkusername/:username', (req, res) => {
  const { username } = req.params;
  User.findAll({ where: { username } }).then((users) => {
    if (users.length) {
      return res.status(200).json({
        type: 'Error',
        error: 'Username already exists',
      });
    }
    return res.status(200).json({
      type: 'Success',
      error: '',
    });
  }).catch(() => res.status(500).json({
    type: 'Error',
    error: 'Internal server error',
  }));
});

// Return 200 if user is logged in
router.get('/login', isLoggedIn, (req, res) => res.status(200).json({
  type: 'Success',
  error: '',
}));

router.post('/logout', isLoggedIn, (req, res) => {
  res.cookie('userId', '', { maxAge: Date.now() });
  socket.disconnectUser(req.user.id);
  req.logOut();
  res.status(200).json({
    type: 'Success',
    error: '',
  });
});

module.exports = router;
