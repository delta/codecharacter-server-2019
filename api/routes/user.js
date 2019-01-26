const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models').user;

const router = express.Router();

router.get('/', (req, res) => {
  if (req.user) {
    const { username, fullName, country } = req.user;
    return res.status(200).json({
      type: 'Success',
      error: '',
      userDetails: { username, fullName, country },
    });
  }
  return res.status(500).json({
    type: 'Error',
    error: 'Internal server error',
  });
});

router.get('/view/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const userDetails = await User.findOne({
      where: { username },
      attributes: ['username', 'fullName', 'country'],
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

router.post('/update', async (req, res) => {
  try {
    if (req.body.email) {
      const existingUser = await User.findOne({ where: { email: req.body.email } });
      if (existingUser) {
        return res.status(400).json({
          type: 'Error',
          error: 'Email is already taken',
        });
      }
    }
    if (req.body.username) {
      const existingUser = await User.findOne({ where: { username: req.body.username } });
      if (existingUser) {
        return res.status(400).json({
          type: 'Error',
          error: 'Username is already taken',
        });
      }
    }
    const updationDoc = {};
    const fieldsUpdated = ['username', 'email', 'fullName', 'country'];
    fieldsUpdated.forEach((key) => {
      if (req.body[key]) {
        updationDoc[key] = req.body[key];
      }
    });
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

router.post('/updatePassword', async (req, res) => {
  try {
    if (req.body.password) {
      if (!req.body.oldPassword) {
        return res.status(400).json({
          type: 'Error',
          error: 'Old password missing',
        });
      }
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
    }
    return res.status(400).json({
      type: 'Error',
      error: 'Password cannot be blank',
    });
  } catch (error) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

module.exports = router;
