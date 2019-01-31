const express = require('express');
const { Op } = require('sequelize');
const { check, validationResult } = require('express-validator/check');

const Leaderboard = require('../models').leaderboard;
const User = require('../models').user;

Leaderboard.belongsTo(User, { foreignKey: 'user_id' });
const router = express.Router();
let obj;
router.post('/:start/:finish', [
  check('start')
    .not().isEmpty().withMessage('Start cannot be empty')
    .isInt()
    .withMessage('Start must be Intteger'),
  check('finish')
    .not().isEmpty().withMessage('Finish cannot be empty')
    .isInt()
    .withMessage('Finish must be Integer'),
], async (req, res) => {
  obj = {};
  const { start, finish } = req.params;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      type: 'Error',
      error: (errors.array())[0],
    });
  }

  const leaderboard = await Leaderboard.findAll(
    {
      include: [
        {
          model: User,
          attributes: ['fullName', 'country'],
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
      obj[index - start] = {};
      obj[index - start].rank = index + 1;
      obj[index - start].rating = leaderboard[index].rating;
      obj[index - start].fullName = leaderboard[index].user.fullName;
      obj[index - start].country = leaderboard[index].user.country;
    }
    return res.status(200).send({ type: 'Success', error: '', message: JSON.stringify(obj) });
  }
  return res.status(400).json({
    message: 'Error',
    error: 'No Entries Found',
  });
});

router.post('/:search/:start/:finish', [
  check('search')
    .not().isEmpty().withMessage('Search cannot be empty'),
  check('start')
    .not().isEmpty().withMessage('Start cannot be empty')
    .isInt()
    .withMessage('Start must be Intteger'),
  check('finish')
    .not().isEmpty().withMessage('Finish cannot be empty')
    .isInt()
    .withMessage('Finish must be Integer'),
], async (req, res) => {
  obj = {};
  const { search, start, finish } = req.params;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      type: 'Error',
      error: (errors.array())[0],
    });
  }

  const leaderboard = await Leaderboard.findAll(
    {
      include: [
        {
          model: User,
          attributes: ['fullName', 'country'],
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
      obj[index - start] = {};
      obj[index - start].rank = index + 1;
      obj[index - start].rating = leaderboard[index].rating;
      obj[index - start].fullName = leaderboard[index].user.fullName;
      obj[index - start].country = leaderboard[index].user.country;
    }
    return res.status(200).send({ type: 'Success', error: '', message: JSON.stringify(obj) });
  }
  return res.status(400).json({
    message: 'Error',
    error: 'No Entries Found',
  });
});
module.exports = router;
