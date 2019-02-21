const express = require('express');
const bcrypt = require('bcrypt');
const { check } = require('express-validator/check');
const shell = require('shelljs');
const path = require('path');
const constants = require('../utils/constant');
const gitHandlers = require('../utils/gitHandlers');
const CodeStatus = require('../models').codestatus;
const { handleValidationErrors } = require('../utils/validation');
const User = require('../models').user;

const router = express.Router();

router.get('/', (req, res) => {
  if (req.user) {
    const {
      username, fullName, country, type, college, avatar,
    } = req.user;
    return res.status(200).json({
      type: 'Success',
      error: '',
      userDetails: {
        username, fullName, country, type, college, avatar,
      },
    });
  }
  return res.status(500).json({
    type: 'Error',
    error: 'Internal server error',
  });
});

router.get('/view/:username', [
  check('username')
    .not().isEmpty().withMessage('Username cannot be empty'),
], async (req, res) => {
  const { username } = req.params;
  try {
    if (handleValidationErrors(req, res)) return null;
    const userDetails = await User.findOne({
      where: { username },
      attributes: ['username', 'fullName', 'country', 'type', 'college', 'avatar'],
    });
    if (!userDetails) {
      return res.status(400).json({
        type: 'Error',
        error: 'User does not exist',
      });
    }
    return res.status(200).json({
      type: 'Success',
      error: '',
      userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.post('/update', [
  check('email')
    .optional()
    .isEmail().withMessage('Invalid email')
    .custom(async value => !(await User.findOne({ where: { email: value } })))
    .withMessage('Email is already taken'),
  check('username')
    .optional()
    .custom(async value => !(await User.findOne({ where: { username: value } })))
    .withMessage('Username is already taken'),
  check('country')
    .optional()
    .isAlpha().withMessage('country should contain only letters'),
], async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) return null;
    const { username } = req.body;
    const updationDoc = {};
    const fieldsUpdated = ['username', 'email', 'fullName', 'country', 'avatar'];
    fieldsUpdated.forEach((key) => {
      if (req.body[key]) {
        updationDoc[key] = req.body[key];
      }
    });
    if (username) {
      const oldUsername = req.user.username;
      const oldUserDir = await gitHandlers.getUserDir(oldUsername);
      const newUserDir = await gitHandlers.getUserDir(username);
      const baseLeaderboardDir = await constants.getLeaderboardStorageDir();
      const newLeaderboardDir = path.resolve(baseLeaderboardDir, username);
      const oldLeaderboardDir = path.resolve(baseLeaderboardDir, oldUsername);
      await Promise.all([
        shell.mv(oldUserDir, newUserDir),
        shell.mv(oldLeaderboardDir, newLeaderboardDir),
        CodeStatus.update({
          latestSrcPath: `${gitHandlers.getUserDir(username)}/code.cpp`,
        }, {
          where: { userId: req.user.id },
        }),
      ]);
    }
    await User.update(updationDoc, { where: { id: req.user.id } });
    return res.status(200).json({
      type: 'Success',
      error: '',
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.post('/updatePassword', [
  check('oldPassword')
    .not().isEmpty().withMessage('Old password missing'),
  check('password')
    .not().isEmpty().withMessage('Password cannot be blank'),
], async (req, res) => {
  if (handleValidationErrors(req, res)) return null;
  try {
    const currentUser = await User.findOne({ where: { username: req.user.username } });
    if (await bcrypt.compare(req.body.oldPassword, currentUser.password)) {
      const passwordHash = await bcrypt.hash(req.body.password, 10);
      await User.update({ password: passwordHash }, { where: { id: req.user.id } });
      return res.status(200).json({
        type: 'Success',
        error: '',
      });
    }
    return res.status(400).json({
      type: 'Error',
      error: 'Wrong password given',
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

module.exports = router;
