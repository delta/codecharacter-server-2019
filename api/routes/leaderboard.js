const express = require('express');
const { Op } = require('sequelize');
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
  const { start, finish } = req.params;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      type: 'Error',
      error: (errors.array())[0],
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

    if (leaderboard.length) {
      if (start > leaderboard.length) {
        return res.status(200).send({ type: 'Success', error: '', message: JSON.parse('') });
      }
      for (let index = start; index < Math.min(finish, leaderboard.length); index += 1) {
        const leaderboardElement = {};
        leaderboardElement.rank = index + 1;
        leaderboardElement.rating = leaderboard[index].rating;
        leaderboardElement.fullName = leaderboard[index].user.fullName;
        leaderboardElement.country = leaderboard[index].user.country;
        leaderboardElement.username = leaderboard[index].user.username;
        leaderboardData.push(leaderboardElement);
      }
      return res.status(200).send({ type: 'Success', error: '', message: JSON.stringify(leaderboardData) });
    }
    return res.status(400).json({
      message: 'Error',
      error: 'No Entries Found',
    });
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
  const { search, start, finish } = req.params;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      type: 'Error',
      error: (errors.array())[0],
    });
  }

  try {
    const leaderboard = await Leaderboard.findAll(
      {
        include: [
          {
            model: User,
            attributes: ['username', 'fullName', 'country'],
            where: {
              fullName: {
                [Op.like]: `%${search}%`,
              },
            },
          },
        ],
        order: ['rating'],
        attributes: ['rating'],
      },
    );
    if (leaderboard.length) {
      if (start > leaderboard.length) {
        return res.status(200).send({ type: 'Success', error: '', message: JSON.parse('') });
      }
      for (let index = start; index < Math.min(finish, leaderboard.length); index += 1) {
        const leaderboardElement = {};
        leaderboardElement.rank = index + 1;
        leaderboardElement.rating = leaderboard[index].rating;
        leaderboardElement.fullName = leaderboard[index].user.fullName;
        leaderboardElement.country = leaderboard[index].user.country;
        leaderboardElement.username = leaderboard[index].user.username;
        leaderboardData.push(leaderboardElement);
      }
      return res.status(200).send({ type: 'Success', error: '', message: JSON.stringify(leaderboardData) });
    }
    return res.status(400).json({
      message: 'Error',
      error: 'No Entries Found',
    });
  } catch (err) {
    return res.status(500).json({
      type: 'Error',
      error: 'Internal Server Error',
    });
  }
});

module.exports = router;
