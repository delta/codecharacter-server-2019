const express = require('express');
const CodeStatus = require('../models/code_status');

const router = express.Router();
const git = require('../utils/git_handlers');
// const ExecuteQueue = require('../models/execute_queue');
// const CompileQueue = require('../models/compile_queue');

router.post('/comptete/:userId1/:userId2', (req, res) => {
  const { userId1, userId2 } = req.params;
  let code1;
  let code2;
  CodeStatus.find({
    where: {
      user_id: userId1,
    },
  }).then((code) => {
    code1 = code;
    return CodeStatus.find({
      where: {
        user_id: userId2,
      },
    });
  }).then(async (code) => {
    code2 = code;
    const dll1 = await git.getFile(userId1, 'one.dll');
    const dll2 = await git.getFile(userId2, 'two.dll');

    // it will update Execute Queue
    console.log(code1, code2, dll1, dll2);
    res.status(200).json({
      message: 'added to queue',
    });
  }).catch((err) => {
    res.status(500).json({
      message: 'Internal server error',
      errors: err,
    });
  });
});
module.exports = router;
