import { LevelConfig } from '../game/Types';

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    name: 'Level 1',
    totalTimeSeconds: 120,
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 0, y: -140 }, angle: 180 },
      { id: 'ring2', position: { x: -140, y: 0 }, angle: 45 },
      { id: 'ring3', position: { x: 140, y: 0 }, angle: -45 },
    ],
    buckles: [
      { ringId: 'ring1', angle: -45, linkedRingId: 'ring3' },
      { ringId: 'ring1', angle: 45, linkedRingId: 'ring2' },
    ],
    rocks: [],
    bombs: [],
  },
  2: {
    name: 'Level 2',
    totalTimeSeconds: 120,
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 0, y: 0 }, angle: 180 },
      { id: 'ring2', position: { x: -200, y: 0 }, angle: 90 },
      { id: 'ring3', position: { x: 0, y: 200 }, angle: 0 },
      { id: 'ring4', position: { x: 200, y: 0 }, angle: -90 },
    ],
    buckles: [
      { ringId: 'ring1', angle: -90, linkedRingId: 'ring4' },
      { ringId: 'ring1', angle: 90, linkedRingId: 'ring2' },
      { ringId: 'ring1', angle: 0, linkedRingId: 'ring3' },
    ],
    rocks: [],
    bombs: [],
  },
  3: {
    name: 'Level 3',
    totalTimeSeconds: 120,
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 0, y: -140 }, angle: 180 },
      { id: 'ring2', position: { x: -140, y: 0 }, angle: 45 },
      { id: 'ring3', position: { x: 140, y: 0 }, angle: -45 },
      { id: 'ring4', position: { x: 0, y: 140 }, angle: 0 },
    ],
    buckles: [
      { ringId: 'ring1', angle: -45, linkedRingId: 'ring3' },
      { ringId: 'ring1', angle: 45, linkedRingId: 'ring2' },
      { ringId: 'ring3', angle: -90, linkedRingId: 'ring4' },
    ],
    rocks: [],
    bombs: [],
  },
  4: {
    name: 'Level 4',
    totalTimeSeconds: 120,
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 0, y: -100 }, angle: 2700 },
      { id: 'ring2', position: { x: 0, y: 100 }, angle: -90 },
      { id: 'ring3', position: { x: -200, y: 100 }, angle: 135 },
      { id: 'ring4', position: { x: 200, y: -100 }, angle: -90 },
    ],
    buckles: [
      { ringId: 'ring1', angle: 0, linkedRingId: 'ring2' },
      { ringId: 'ring2', angle: 0, linkedRingId: 'ring3' },
      { ringId: 'ring4', angle: 0, linkedRingId: 'ring1' },
    ],
    rocks: [{ id: 'rock1', ringId: 'ring2' }],
    bombs: [{ id: 'bomb1', ringId: 'ring3', countdown: 30 }],
  },
  5: {
    name: 'Level 5',
    totalTimeSeconds: 120,
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 0, y: 0 }, angle: -135 },
      { id: 'ring2', position: { x: 140, y: 140 }, angle: -45 },
      { id: 'ring3', position: { x: 0, y: 280 }, angle: 45 },
      { id: 'ring4', position: { x: -140, y: -140 }, angle: 135 },
      { id: 'ring5', position: { x: 0, y: -280 }, angle: -135 },
    ],
    buckles: [
      { ringId: 'ring1', angle: -90, linkedRingId: 'ring2' },
      { ringId: 'ring1', angle: 90, linkedRingId: 'ring4' },
      { ringId: 'ring2', angle: -90, linkedRingId: 'ring3' },
      { ringId: 'ring4', angle: -90, linkedRingId: 'ring5' },
    ],
    rocks: [],
    bombs: [],
  },
  6: {
    name: 'Level 6',
    totalTimeSeconds: 120,
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: -200, y: 0 }, angle: 90 },
      { id: 'ring2', position: { x: 0, y: 0 }, angle: 0 },
      { id: 'ring3', position: { x: 200, y: 0 }, angle: -90 },
      { id: 'ring4', position: { x: -200, y: -200 }, angle: 180 },
      { id: 'ring5', position: { x: 200, y: 200 }, angle: 0 },
    ],
    buckles: [
      { ringId: 'ring1', angle: -90, linkedRingId: 'ring4' },
      { ringId: 'ring2', angle: 90, linkedRingId: 'ring3' },
      { ringId: 'ring2', angle: -90, linkedRingId: 'ring1' },
      { ringId: 'ring3', angle: -90, linkedRingId: 'ring5' },
    ],
    rocks: [{ id: 'rock1', ringId: 'ring4' }],
    bombs: [{ id: 'bomb1', ringId: 'ring5', countdown: 30 }],
  },
  7: {
    name: 'Level 7',
    totalTimeSeconds: 120,
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 0, y: 200 }, angle: 0 },
      { id: 'ring2', position: { x: -200, y: 200 }, angle: 0 },
      { id: 'ring3', position: { x: 0, y: 0 }, angle: 90 },
      { id: 'ring4', position: { x: 200, y: 200 }, angle: -90 },
      { id: 'ring5', position: { x: -200, y: 0 }, angle: -270 },
      { id: 'ring6', position: { x: 0, y: -200 }, angle: -180 },
      { id: 'ring7', position: { x: 200, y: 0 }, angle: -180 },
      { id: 'ring8', position: { x: -200, y: -200 }, angle: -90 },
    ],
    buckles: [
      { ringId: 'ring1', angle: -90, linkedRingId: 'ring2' },
      { ringId: 'ring1', angle: 90, linkedRingId: 'ring4' },
      { ringId: 'ring1', angle: 0, linkedRingId: 'ring3' },
      { ringId: 'ring5', angle: 90, linkedRingId: 'ring2' },
      { ringId: 'ring5', angle: -90, linkedRingId: 'ring8' },
      { ringId: 'ring6', angle: 0, linkedRingId: 'ring3' },
      { ringId: 'ring7', angle: 0, linkedRingId: 'ring4' },
    ],
    rocks: [{ id: 'rock1', ringId: 'ring8' }],
    bombs: [{ id: 'bomb1', ringId: 'ring1', countdown: 30 }],
  },
  8: {
    name: 'Level 8',
    totalTimeSeconds: 120,
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: -100, y: 240 }, angle: -45 },
      { id: 'ring2', position: { x: -240, y: 100 }, angle: 0 },
      { id: 'ring3', position: { x: -240, y: -100 }, angle: -225 },
      { id: 'ring4', position: { x: -100, y: -240 }, angle: -180 },
      { id: 'ring5', position: { x: 100, y: -240 }, angle: -135 },
      { id: 'ring6', position: { x: 240, y: -100 }, angle: -90 },
      { id: 'ring7', position: { x: 240, y: 100 }, angle: -90 },
      { id: 'ring8', position: { x: 100, y: 240 }, angle: 0 },
    ],
    buckles: [
      { ringId: 'ring1', angle: 0, linkedRingId: 'ring2' },
      { ringId: 'ring2', angle: 0, linkedRingId: 'ring3' },
      { ringId: 'ring3', angle: -90, linkedRingId: 'ring4' },
      { ringId: 'ring4', angle: -90, linkedRingId: 'ring5' },
      { ringId: 'ring5', angle: -90, linkedRingId: 'ring6' },
      { ringId: 'ring6', angle: -90, linkedRingId: 'ring7' },
      { ringId: 'ring7', angle: -45, linkedRingId: 'ring8' },
    ],
    rocks: [],
    bombs: [],
  },
  9: {
    name: 'Level 9',
    totalTimeSeconds: 120,
    ringScale: 0.4,
    rings: [
      { id: 'ring1', position: { x: -112, y: -112 }, angle: -45 },
      { id: 'ring2', position: { x: 0, y: 0 }, angle: 45 },
      { id: 'ring3', position: { x: 112, y: -112 }, angle: -45 },
      { id: 'ring4', position: { x: -112, y: 111 }, angle: 180 },
      { id: 'ring5', position: { x: 112, y: 112 }, angle: -45 },
      { id: 'ring6', position: { x: -224, y: 224 }, angle: 45 },
      { id: 'ring8', position: { x: -224, y: -224 }, angle: 90 },
      { id: 'ring9', position: { x: 224, y: -224 }, angle: -405 },
      { id: 'ring10', position: { x: -224, y: -1 }, angle: 135 },
      { id: 'ring11', position: { x: 224, y: 0 }, angle: -135 },
      { id: 'ring12', position: { x: 0, y: 224 }, angle: -45 },
      { id: 'ring13', position: { x: 0, y: -224 }, angle: -225 },
    ],
    buckles: [
      { ringId: 'ring1', angle: 0, linkedRingId: 'ring8' },
      { ringId: 'ring1', angle: 90, linkedRingId: 'ring13' },
      { ringId: 'ring2', angle: 90, linkedRingId: 'ring5' },
      { ringId: 'ring3', angle: -90, linkedRingId: 'ring2' },
      { ringId: 'ring3', angle: 90, linkedRingId: 'ring9' },
      { ringId: 'ring4', angle: 45, linkedRingId: 'ring6' },
      { ringId: 'ring10', angle: -90, linkedRingId: 'ring1' },
      { ringId: 'ring11', angle: 0, linkedRingId: 'ring5' },
      { ringId: 'ring12', angle: 90, linkedRingId: 'ring5' },
      { ringId: 'ring12', angle: 0, linkedRingId: 'ring4' },
      { ringId: 'ring13', angle: 0, linkedRingId: 'ring3' },
    ],
    rocks: [],
    bombs: [],
  },
  10: {
    name: 'Level 10',
    totalTimeSeconds: 120,
    ringScale: 0.3,
    rings: [
      { id: 'ring1', position: { x: -255, y: 0 }, angle: 90 },
      { id: 'ring2', position: { x: -85, y: 0 }, angle: -45 },
      { id: 'ring3', position: { x: 85, y: 0 }, angle: -225 },
      { id: 'ring4', position: { x: 255, y: 0 }, angle: -90 },
      { id: 'ring5', position: { x: -170, y: 85 }, angle: 45 },
      { id: 'ring6', position: { x: 0, y: 85 }, angle: -225 },
      { id: 'ring7', position: { x: 170, y: 85 }, angle: -45 },
      { id: 'ring8', position: { x: -85, y: 170 }, angle: 45 },
      { id: 'ring9', position: { x: 85, y: 170 }, angle: -45 },
      { id: 'ring10', position: { x: 0, y: 255 }, angle: 0 },
      { id: 'ring11', position: { x: -170, y: -85 }, angle: -225 },
      { id: 'ring12', position: { x: 0, y: -85 }, angle: -45 },
      { id: 'ring13', position: { x: 170, y: -85 }, angle: -135 },
      { id: 'ring14', position: { x: -85, y: -170 }, angle: 135 },
      { id: 'ring15', position: { x: 85, y: -170 }, angle: -135 },
      { id: 'ring16', position: { x: 0, y: -255 }, angle: -180 },
    ],
    buckles: [
      { ringId: 'ring1', angle: -45, linkedRingId: 'ring11' },
      { ringId: 'ring1', angle: 45, linkedRingId: 'ring5' },
      { ringId: 'ring2', angle: 90, linkedRingId: 'ring12' },
      { ringId: 'ring2', angle: 0, linkedRingId: 'ring11' },
      { ringId: 'ring3', angle: 0, linkedRingId: 'ring7' },
      { ringId: 'ring4', angle: 45, linkedRingId: 'ring13' },
      { ringId: 'ring5', angle: 90, linkedRingId: 'ring8' },
      { ringId: 'ring8', angle: 90, linkedRingId: 'ring10' },
      { ringId: 'ring8', angle: 0, linkedRingId: 'ring6' },
      { ringId: 'ring9', angle: 0, linkedRingId: 'ring6' },
      { ringId: 'ring9', angle: 90, linkedRingId: 'ring7' },
      { ringId: 'ring13', angle: 90, linkedRingId: 'ring15' },
      { ringId: 'ring14', angle: 90, linkedRingId: 'ring11' },
      { ringId: 'ring14', angle: 0, linkedRingId: 'ring12' },
      { ringId: 'ring15', angle: 0, linkedRingId: 'ring12' },
      { ringId: 'ring15', angle: 90, linkedRingId: 'ring16' },
    ],
    rocks: [],
    bombs: [],
  },
  11: {
    name: 'Level 11',
    totalTimeSeconds: 30,
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: -255, y: 155 }, angle: 90 },
      { id: 'ring2', position: { x: 0, y: 155 }, angle: 0 },
      { id: 'ring3', position: { x: 255, y: 155 }, angle: -90 },
      { id: 'ring4', position: { x: -125, y: 0 }, angle: -270 },
      { id: 'ring5', position: { x: 125, y: 0 }, angle: 270 },
      { id: 'ring6', position: { x: 0, y: -155 }, angle: -180 },
    ],
    buckles: [
      { ringId: 'ring1', angle: -50, linkedRingId: 'ring4' },
      { ringId: 'ring2', angle: 40, linkedRingId: 'ring5' },
      { ringId: 'ring2', angle: -40, linkedRingId: 'ring4' },
      { ringId: 'ring3', angle: 50, linkedRingId: 'ring5' },
      { ringId: 'ring6', angle: 40, linkedRingId: 'ring4' },
      { ringId: 'ring6', angle: -40, linkedRingId: 'ring5' },
    ],
    rocks: [{ id: 'rock1', ringId: 'ring2' }],
    bombs: [{ id: 'bomb1', ringId: 'ring6', countdown: 30 }],
  },
  12: {
    name: 'Level 12',
    totalTimeSeconds: 30,
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 125, y: -100 }, angle: 90 },
      { id: 'ring2', position: { x: 0, y: 255 }, angle: 0 },
      { id: 'ring3', position: { x: -125, y: -300 }, angle: -90 },
      { id: 'ring4', position: { x: -125, y: 100 }, angle: -270 },
      { id: 'ring5', position: { x: 125, y: 100 }, angle: 270 },
      { id: 'ring6', position: { x: -125, y: -100 }, angle: -90 },
      { id: 'ring7', position: { x: 125, y: -300 }, angle: 90 },
    ],
    buckles: [
      { ringId: 'ring1', angle: 90, linkedRingId: 'ring5' },
      { ringId: 'ring2', angle: 40, linkedRingId: 'ring5' },
      { ringId: 'ring2', angle: -40, linkedRingId: 'ring4' },
      { ringId: 'ring3', angle: -90, linkedRingId: 'ring6' },
      { ringId: 'ring6', angle: -90, linkedRingId: 'ring4' },
      { ringId: 'ring7', angle: 90, linkedRingId: 'ring1' },
    ],
    rocks: [{ id: 'rock1', ringId: 'ring6' }],
    bombs: [{ id: 'bomb1', ringId: 'ring4', countdown: 30 }],
  },
};

export const MAX_LEVEL = Object.keys(LEVEL_CONFIGS).length;

export function getLevelConfig(id: number): LevelConfig {
  const config = LEVEL_CONFIGS[id];
  if (!config) {
    throw new Error(`Level not found: ${id}`);
  }
  return config;
}

export function getAllLevelIds(): number[] {
  return Object.keys(LEVEL_CONFIGS).map((key) => Number(key));
}

export function getFirstBombLevelId(): number {
  const ids = getAllLevelIds().sort((a, b) => a - b);
  for (const id of ids) {
    if (getLevelConfig(id).bombs.length > 0) {
      return id;
    }
  }
  throw new Error('LevelConfig 中未配置包含炸弹的关卡');
}
