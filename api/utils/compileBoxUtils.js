const CompileBox = require('../models').compilebox;

const compileBoxes = {};
module.exports.initiateCompileBoxes = async () => {
  const compileBoxesArray = await CompileBox.findAll();
  for (let i = 0; i < compileBoxesArray.length; i += 1) {
    compileBoxes[compileBoxesArray[i].id] = compileBoxesArray[i].dataValues;
    compileBoxes[compileBoxesArray[i].id].busy = false;
  }
};

module.exports.assignCompileBox = async () => {
  const keysArray = Object.keys(compileBoxes);
  console.log(keysArray);
  let indexFree = -1;
  keysArray.forEach((key) => {
    if (!compileBoxes[key].busy) {
      compileBoxes[key].busy = true;
      indexFree = Number(key);
    }
  });
  return indexFree;
};

module.exports.makeCompileBoxBusy = async (id) => {
  if (compileBoxes[id].busy) {
    return false;
  }
  compileBoxes[id].busy = true;
  return true;
};

module.exports.makeCompileBoxFree = async (id) => {
  if (!compileBoxes[id].busy) {
    return false;
  }
  compileBoxes[id].busy = false;
  return true;
};

module.exports.getFreeCompileBoxes = async () => {
  const freeCompileBoxes = [];
  const keysArray = compileBoxes.keys();
  keysArray.array.forEach((key) => {
    if (!compileBoxes[key].busy) {
      freeCompileBoxes.push(compileBoxes[key].id);
    }
  });
};
