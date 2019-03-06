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
  try {
    const compileBox = await CompileBox.findOne({
      where: { status: 'IDLE' },
    });

    if (compileBox) return compileBox.id;

    return -1;
  } catch (err) {
    return -1;
  }
};

const changeCompileBoxState = async (id, status) => {
  const compileBox = await CompileBox.findOne({
    where: { id },
  });

  if (!compileBox) return false;

  compileBox.status = status;
  await compileBox.save();

  return true;
};

const getCompileBoxStatus = async (compileBoxId) => {
  const compileBox = await CompileBox.findOne({
    where: { id: compileBoxId },
  });

  if (compileBox) return compileBox.status;

  return 'BUSY';
};

const getUrl = async (compileBoxId) => {
  try {
    const compileBox = await CompileBox.findOne({
      where: { id: compileBoxId },
    });

    if (compileBox) return compileBox.url;

    return '';
  } catch (err) {
    return '';
  }
};

module.exports = {
  initializeCompileBoxes,
  getIdleCompileBox,
  changeCompileBoxState,
  getCompileBoxStatus,
  getUrl,
};
