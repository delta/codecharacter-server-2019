const express = require('express');
const { check, validationResult } = require('express-validator/check');

const Leaderboard = require('../models').leaderboard;
const User = require('../models').user;

const router = express.Router();
router.get('/:start/:finish', [
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
    return res.status(200).json({ type: 'Success', error: '', leaderboardData });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

router.get('/:search/:start/:finish', [
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

    const searchData = [];
    if (leaderboard && leaderboard.length > 0) {
      finish = Math.min(finish, leaderboard.length);
      leaderboard.forEach((leaderboardElement, index) => {
        if (leaderboardElement.user.username.includes(search)) {
          const searchElement = {};
          searchElement.rank = index + 1;
          searchElement.rating = leaderboardElement.rating;
          searchElement.fullName = leaderboardElement.user.fullName;
          searchElement.country = leaderboardElement.user.country;
          searchElement.username = leaderboardElement.user.username;
          if ((count + 1) >= start && (count + 1) <= finish) {
            searchData[count - start + 1] = leaderboardElement;
          }
          count += 1;
        }
      });
    }
    return res.status(200).json({ type: 'Success', error: '', searchData });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

module.exports = router;
