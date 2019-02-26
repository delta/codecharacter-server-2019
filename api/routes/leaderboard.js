const express = require('express');
const { check, validationResult } = require('express-validator/check');
const { handleValidationErrors } = require('../utils/validation');
const constantUtils = require('../utils/constant');
const Match = require('../models').match;
const leaderboardUtils = require('../utils/leaderboard');
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
  check('type')
    .optional()
    .custom(async value => ['Student', 'Professional'].includes(value))
    .withMessage('Invalid type'),
], async (req, res) => {
  if (handleValidationErrors(req, res)) return null;
  const leaderboardData = [];
  let { start, finish } = req.params;
  const { type } = req.query;
  start = parseInt(start, 10);
  finish = parseInt(finish, 10);
  const joinOptions = {
    model: User,
    attributes: ['id', 'username', 'fullName', 'country', 'avatar', 'type'],
  };

  if (type) {
    joinOptions.where = { type };
  }

  try {
    const leaderboard = await Leaderboard.findAll(
      {
        include: [
          joinOptions,
        ],
        order: [['rating', 'DESC']],
        attributes: ['rating'],
      },
    );

    finish = Math.min(finish, leaderboard.length);

    const fetchWinLossData = leaderboard.map(item => leaderboardUtils.getWinLossData(item.user.id));
    const winLossData = await Promise.all(fetchWinLossData);

    let currentRank = 0;
    let previousRating = 0;

    leaderboard.forEach((leaderboardElement, index) => {
      const searchElement = {};
      searchElement.id = leaderboardElement.user.id;
      searchElement.rating = leaderboardElement.rating;
      searchElement.rank = currentRank + 1;
      searchElement.fullName = leaderboardElement.user.fullName;
      searchElement.country = leaderboardElement.user.country;
      searchElement.username = leaderboardElement.user.username;
      searchElement.avatar = leaderboardElement.user.avatar;
      searchElement.type = leaderboardElement.user.type;
      searchElement.numWin = winLossData[index].win;
      searchElement.numLoss = winLossData[index].loss;
      searchElement.numTie = winLossData[index].tie;
      if (index >= start - 1 && index < finish) {
        leaderboardData.push(searchElement);
      }
      if (previousRating !== searchElement.rating) currentRank += 1;
      previousRating = searchElement.rating;
    });

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
  check('type')
    .optional()
    .custom(async value => ['Student', 'Professional'].includes(value))
    .withMessage('Invalid type'),
], async (req, res) => {
  let { start, finish } = req.params;
  let { search: searchPattern } = req.params;
  const { type } = req.query;

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
  const joinOptions = {
    model: User,
    attributes: ['username', 'fullName', 'country', 'id', 'avatar', 'type'],
  };

  if (type) {
    joinOptions.where = { type };
  }
  try {
    const leaderboard = await Leaderboard.findAll({
      include: [
        joinOptions,
      ],
      order: [['rating', 'DESC']],
      attributes: ['rating'],
    });

    let count = 1;
    const searchData = [];
    if (leaderboard && leaderboard.length > 0) {
      finish = Math.min(finish, leaderboard.length);

      const fetchWinData = leaderboard.map(item => leaderboardUtils.getWinLossData(item.user.id));
      const winLossData = await Promise.all(fetchWinData);

      let currentRank = 1;
      let previousRating = 0;

      leaderboard.forEach((leaderboardElement, index) => {
        if (leaderboardElement.user.username.includes(searchPattern)) {
          const searchElement = {};
          searchElement.id = leaderboard[index].user.id;
          searchElement.rating = leaderboardElement.rating;
          searchElement.rank = currentRank;
          searchElement.fullName = leaderboardElement.user.fullName;
          searchElement.country = leaderboardElement.user.country;
          searchElement.username = leaderboardElement.user.username;
          searchElement.avatar = leaderboardElement.user.avatar;
          searchElement.type = leaderboardElement.user.type;
          searchElement.numWin = winLossData[index].win;
          searchElement.numLoss = winLossData[index].loss;
          searchElement.numTie = winLossData[index].tie;
          if (count >= start && count <= finish) {
            searchData[count - start] = searchElement;
          }
          if (previousRating !== searchElement.rating) currentRank += 1;
          previousRating = searchElement.rating;
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

    const msTimeLeft = minMatchWaitTime - (currentTime.getTime() - lastMatchTime.getTime());
    return res.status(200)
      .json({
        type: 'Success',
        timer: Math.floor(msTimeLeft / 1000),
      });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

module.exports = router;
