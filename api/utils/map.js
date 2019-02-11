const fs = require('fs');
const Map = require('../models').map;
const Constant = require('../models').constant;

const getMap = async (mapId) => {
  const mapStorageDir = (await Constant.findOne({ where: { key: 'DEFAULT_MAP_STORAGE_DIR' } })).value;
  const map = await Map.findOne({ where: { id: mapId } });
  const mapText = fs.readFileSync(`${mapStorageDir}/${map.path}`);
  return mapText.toString();
};

const getMapIds = async () => {
  const mapIds = await Map.findAll({
    attributes: ['id'],
  });
  const ids = mapIds.map(mapId => mapId.id);
  return ids;
};

module.exports = {
  getMap,
  getMapIds,
};
