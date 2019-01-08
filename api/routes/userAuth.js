const express = require('express');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const passport = require('passport');
const User = require('../models').user;

const router = express.Router();

router.post('/register', (req, res) => {
  const {
    username, password, email, country, fullName, pragyanId,
  } = req.body;
  User.findOne({
    where: {
      [Op.or]: [{ username }, { email }],
    },
  }).then(async (user) => {
    if (user) {
      res.status(500).send('Username/email already taken');
    } else {
      const hash = await bcrypt.hash(password, 10);
      User.create({
        username,
        email,
        fullName,
        country: country || 'IN',
        pragyanId: pragyanId || null,
        password: hash,
      }).then((newUser) => {
        if (newUser) {
          res.sendStatus(200);
        } else {
          res.sendStatus(401);
        }
      }).catch((err) => {
        res.status(500).send(err);
      });
    }
  }).catch((err) => {
    res.status(500).send(err);
  });
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

module.exports = router;
