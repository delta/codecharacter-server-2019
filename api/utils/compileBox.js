const CompileBox = require('../models').compilebox;

const initializeCompileBoxes = async () => {
  // Todo: Clear all jobs running inside every compilebox
  await CompileBox.update({
    staus: 'IDLE',
  }, {
    where: { status: 'BUSY' },
  });
};

const getIdleCompileBox = async () => {
  const compileBox = await CompileBox.findOne({
    where: { status: 'IDLE' },
  });

  if (compileBox) return compileBox.id;

  return -1;
};

const changeCompileBoxState = async (id, state) => {
  const compileBox = await CompileBox.findOne({
    where: { id },
  });

  if (!compileBox) return false;

  if (state !== 'IDLE' || state !== 'BUSY') {
    return false;
  }

  compileBox.state = state;
  await compileBox.save();

  return true;
};

const getStatus = async (compileBoxId) => {
  const compileBox = await CompileBox.findOne({
    where: { id: compileBoxId },
  });

  if (compileBox) return compileBox.status;

  return 'BUSY';
};

const getUrl = async (compileBoxId) => {
  const compileBox = await CompileBox.findOne({
    where: { id: compileBoxId },
  });

  if (compileBox) return compileBox.url;

  return '';
};

module.exports = {
  initializeCompileBoxes,
  getIdleCompileBox,
  changeCompileBoxState,
  getStatus,
  getUrl,
};
