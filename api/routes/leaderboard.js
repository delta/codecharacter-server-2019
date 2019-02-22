const express = require('express');
const { check, validationResult } = require('express-validator/check');
const { handleValidationErrors } = require('../utils/validation');
const constantUtils = require('../utils/constant');
const Match = require('../models').match;

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
    .withMessage('Finish must be Integer')
    .custom((value, { req }) => parseInt(value, 10) >= parseInt(req.params.start, 10))
    .withMessage('Start cannot be greater than Finish'),
], async (req, res) => {
  if (handleValidationErrors(req, res)) return null;
  const leaderboardData = [];
  let { start, finish } = req.params;
  start = parseInt(start, 10);
  finish = parseInt(finish, 10);
  try {
    const leaderboard = await Leaderboard.findAll(
      {
        include: [
          {
            model: User,
            attributes: ['username', 'fullName', 'country', 'avatar'],
          },
        ],
        order: ['rating'],
        attributes: ['rating'],
      },
    );

    finish = Math.min(finish, leaderboard.length);
    for (let index = start - 1; index < finish; index += 1) {
      const leaderboardElement = {};
      leaderboardElement.userId = leaderboard[index].user.id;
      leaderboardElement.rank = index + 1;
      leaderboardElement.rating = leaderboard[index].rating;
      leaderboardElement.fullName = leaderboard[index].user.fullName;
      leaderboardElement.country = leaderboard[index].user.country;
      leaderboardElement.username = leaderboard[index].user.username;
      leaderboardElement.avatar = leaderboardElement.user.avatar;

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
  let { search: searchPattern } = req.params;

  const errors = validationResult(req);

  if (searchPattern === '*') searchPattern = '';

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
    const leaderboard = await Leaderboard.findAll({
      include: [
        {
          model: User,
          attributes: ['username', 'fullName', 'country', 'id', 'avatar'],
        },
      ],
      order: ['rating'],
      attributes: ['rating'],
    });

    let count = 1;
    const searchData = [];
    if (leaderboard && leaderboard.length > 0) {
      finish = Math.min(finish, leaderboard.length);

      leaderboard.forEach((leaderboardElement, index) => {
        if (leaderboardElement.user.username.includes(searchPattern)) {
          const searchElement = {};
          searchElement.rank = index + 1;
          searchElement.id = leaderboard[index].user.id;
          searchElement.rating = leaderboardElement.rating;
          searchElement.fullName = leaderboardElement.user.fullName;
          searchElement.country = leaderboardElement.user.country;
          searchElement.username = leaderboardElement.user.username;
          searchElement.avatar = leaderboard.user.avatar;

          if (count >= start && count <= finish) {
            searchData[count - start] = searchElement;
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

router.get('/timer', async (req, res) => {
  try {
    const { id } = req.user;
    const lastMatch = await Match.findOne({
      where: { userId1: id },
      limit: 1,
      order: [
        ['createdAt', 'DESC'],
      ],
    });
    if (!lastMatch) {
      return res.status(200).json({
        type: 'Success',
        timer: 0,
      });
    }

    const minMatchWaitTime = await constantUtils.minMatchWaitTime();

    const lastMatchTime = new Date(lastMatch.createdAt);
    const currentTime = new Date();

    if ((currentTime.getTime() - lastMatchTime.getTime()) >= minMatchWaitTime) {
      return res.status(200)
        .json({
          type: 'Success',
          timer: 0,
        });
    }
    return res.status(200)
      .json({
        type: 'Success',
        timer: (minMatchWaitTime - (currentTime.getTime() - lastMatchTime.getTime())) / 1000,
      });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

module.exports = router;
