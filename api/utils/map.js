const fs = require('fs');
const path = require('path');
const Map = require('../models').map;
const Constant = require('../models').constant;

const getMap = async (mapId) => {
  const mapStorageDir = await Constant.findOne({ where: { key: 'DEFAULT_MAP_STORAGE_DIR' } });
  const map = await Map.findOne({ where: { id: mapId } });
  const mapText = fs.readFileSync(path.join(mapStorageDir, map.path));
  return mapText.toString();
};

const getMapIds = async () => {
  const mapIds = await Map.find({
    attributes: ['id'],
  });

  return mapIds;
};

module.exports = {
  getMap,
  getMapIds,
};
