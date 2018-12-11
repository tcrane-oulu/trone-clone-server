// tslint:disable-next-line:no-var-requires
const config = require('../../config.json');
export const MAP_SIZE = config.mapSize;
export const TICK_RATE = config.tickRate;
export const VERSION = config.version;
export const FAKE_CLIENTS = config.fakeClients;
export const SPEED_TILES_PER_TICK = config.carSpeed / TICK_RATE;
