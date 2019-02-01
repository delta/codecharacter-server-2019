const express = require('express');
const { check, validationResult } = require('express-validator/check');

const Leaderboard = require('../models').leaderboard;
const User = require('../models').user;

Leaderboard.belongsTo(User, { foreignKey: 'user_id' });
const router = express.Router();
router.post('/:start/:finish', [
  check('start')
    .not().isEmpty().withMessage('Start cannot be empty')
    .isInt()
    .withMessage('Start must be Integer'),
  check('finish')
    .not().isEmpty().withMessage('Finish cannot be empty')
    .isInt()
    .withMessage('Finish must be Integer'),
], async (req, res) => {
  const leaderboardData = [];
  let { start, finish } = req.params;
  const errors = validationResult(req);

  start = parseInt(start, 10);
  finish = parseInt(finish, 10);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      type: 'Error',
      error: (errors.array())[0],
    });
  }

  if (start > finish) {
    return res.status(400).json({
      type: 'Error',
      error: 'Start cannot be greater than Finish',
    });
  }

  try {
    const leaderboard = await Leaderboard.findAll(
      {
        include: [
          {
            model: User,
            attributes: ['username', 'fullName', 'country'],
          },
        ],
        order: ['rating'],
        attributes: ['rating'],
      },
    );

    finish = Math.min(finish, leaderboard.length);
    for (let index = start - 1; index < finish; index += 1) {
      const leaderboardElement = {};
      leaderboardElement.rank = index + 1;
      leaderboardElement.rating = leaderboard[index].rating;
      leaderboardElement.fullName = leaderboard[index].user.fullName;
      leaderboardElement.country = leaderboard[index].user.country;
      leaderboardElement.username = leaderboard[index].user.username;
      leaderboardData.push(leaderboardElement);
    }
    return res.status(200).send({ type: 'Success', error: '', leaderboardData: JSON.stringify(leaderboardData) });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

router.post('/:search/:start/:finish', [
  check('search')
    .not().isEmpty().withMessage('Search cannot be empty'),
  check('start')
    .not().isEmpty().withMessage('Start cannot be empty')
    .isInt()
    .withMessage('Start must be Integer'),
  check('finish')
    .not().isEmpty().withMessage('Finish cannot be empty')
    .isInt()
    .withMessage('Finish must be Integer'),
], async (req, res) => {
  const leaderboardData = [];
  let { start, finish } = req.params;
  const { search } = req.params;
  const errors = validationResult(req);
  let count = 0;

  start = parseInt(start, 10);
  finish = parseInt(finish, 10);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      type: 'Error',
      error: (errors.array())[0],
    });
  }

  if (start > finish) {
    return res.status(400).json({
      type: 'Error',
      error: 'Start cannot be greater than Finish',
    });
  }

  try {
    const leaderboard = await Leaderboard.findAll(
      {
        include: [
          {
            model: User,
            attributes: ['username', 'fullName', 'country'],
          },
        ],
        order: ['rating'],
        attributes: ['rating'],
      },
    );

    finish = Math.min(finish, leaderboard.length);
    for (let index = start - 1; index < finish; index += 1) {
      if (leaderboard[index].user.fullName.includes(search)) {
        const leaderboardElement = {};
        leaderboardElement.rank = index + 1;
        leaderboardElement.rating = leaderboard[index].rating;
        leaderboardElement.fullName = leaderboard[index].user.fullName;
        leaderboardElement.country = leaderboard[index].user.country;
        leaderboardElement.username = leaderboard[index].user.username;
        leaderboardData[count] = leaderboardElement;
        count += 1;
      }
    }
    return res.status(200).send({ type: 'Success', error: '', leaderboardData: JSON.stringify(leaderboardData) });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

module.exports = router;
