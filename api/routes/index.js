const express = require('express');
const codeRoutes = require('./code');
const userAuthRoutes = require('./userAuth');
const userRoutes = require('./user');
const leaderboardRoutes = require('./leaderboard');
const simulationRoutes = require('./simulation');

const router = express.Router();

router.use('/code', codeRoutes);
router.use('/user/profile', userRoutes);
router.use('/user', userAuthRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/compete', simulationRoutes);


module.exports = router;
