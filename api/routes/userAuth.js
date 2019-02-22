const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const randomString = require('randomstring');
const sendgridMail = require('@sendgrid/mail');
const { Op } = require('sequelize');
const { check } = require('express-validator/check');
const config = require('../config/config');
const { handleValidationErrors } = require('../utils/validation');
const User = require('../models').user;
const codeStatus = require('../models').codestatus;
const git = require('../utils/gitHandlers');
const socket = require('../utils/socketHandlers');
const notificationUtils = require('../utils/notifications');
const isLoggedIn = require('../middlewares/isLoggedIn');

const router = express.Router();

router.post('/register', [
  check('username')
    .not().isEmpty().withMessage('Username cannot be empty')
    .isAlphanumeric()
    .withMessage('Username must be alphanumeric')
    .isLength({ min: 5, max: 50 })
    .withMessage('Username must be 5-50 characters long'),
  check('password')
    .not().isEmpty().withMessage('Password cannot be empty'),
  check('repeatPassword', 'repeatPassword field must have the same value as the password field')
    .custom((value, { req }) => value === req.body.password)
    .not().isEmpty()
    .withMessage('Password cannot be empty'),
  check('email')
    .not().isEmpty().withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Invalid Email'),
  check('fullName')
    .not().isEmpty().withMessage('Full Name cannot be empty'),
  check('country')
    .isAlpha(),
  check('type')
    .not().isEmpty().withMessage('Type can not be empty')
    .custom(value => ['Student', 'Professional'].includes(value))
    .withMessage('Type should be either Student or Professional'),
  check('college')
    .custom((value, { req }) => {
      if (req.body.type === 'Student') {
        return !!value;
      }
      return true;
    })
    .withMessage('College is required for type student'),
], async (req, res) => {
  const {
    username, password, email, country, fullName, pragyanId, type, college, avatar,
  } = req.body;

  if (handleValidationErrors(req, res)) return null;


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
      type,
      college,
      avatar,
      isPragyan: !!pragyanId,
    });
    if (newUser) {
      const tokenSource = randomString.generate(20);
      await User.update({
        activationToken: await bcrypt.hash(tokenSource, 10),
      }, {
        where: { id: newUser.id },
      });
      sendgridMail.setApiKey(config.sendgridAPIKey);
      const msg = {
        to: newUser.email,
        from: 'codecharacter@pragyan.org',
        subject: 'Activate your Code Character account',
        html:
          `<p>Hello ${newUser.fullName}, </p>
            <p>Please click the following link to verify your account :</p>
            <p><a href="https://code.pragyan.org/api/user/verify/${newUser.username}/${tokenSource}">https://code.pragyan.org/api/user/verify/${newUser.username}/${tokenSource}</a></p>
            <p>Happy coding!</p>
          `,
      };
      sendgridMail.send(msg);
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
    const user = await User.findOne({
      where: {
        username,
      },
    });
    if (user) {
      await codeStatus.destroy({
        where: {
          userId: user.id,
        },
      });
      await git.removeDir(username);
      await user.destroy();
    }
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

router.post('/login', [
  check('username')
    .not().isEmpty().withMessage('Username cannot be empty'),
  check('password')
    .not().isEmpty().withMessage('Password cannot be empty'),
], async (req, res, next) => {
  if (handleValidationErrors(req, res)) return null;
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
  return null; // coz eslint forces to have a return at the end
});


router.get('/checkusername/:username', [
  check('username')
    .not().isEmpty().withMessage('Cannot check for empty username'),
], (req, res) => {
  if (handleValidationErrors(req, res)) return null;

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
  return null; // coz eslint forces to have a return at the end
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

router.get('/verify/:username/:tokenSource', async (req, res) => {
  const { username, tokenSource } = req.params;
  const user = await User.findOne({
    where: {
      username,
    },
  });
  if (await bcrypt.compare(tokenSource, user.activationToken)) {
    socket.sendMessage(user.id, 'Your account has been activated', 'Activation success');
    await User.update({ activated: true }, { where: { id: user.id } });
    await notificationUtils.createNotification('Success', 'Email verification', 'Email verified successfully', user.id);
    return res.status(200).redirect('https://code.pragyan.org');
  }
  return res.status(400).redirect('https://code.pragyan.org');
});

module.exports = router;
