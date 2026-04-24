import { LevelConfig } from '../game/Types';

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    id: 1,
    name: 'Level 1',
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 0, y: -140 }, angle: 180 },
      { id: 'ring2', position: { x: -140, y: 0 }, angle: 45 },
      { id: 'ring3', position: { x: 140, y: 0 }, angle: -45 },
    ],
    buckles: [
      { id: 'buckle2', ringId: 'ring1', angle: -45, linkedRingId: 'ring3' },
      { id: 'buckle4', ringId: 'ring1', angle: 45, linkedRingId: 'ring2' },
    ],
    rocks: [],
    bombs: [],
  },
  2: {
    id: 2,
    name: 'Level 2',
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 0, y: 0 }, angle: 180 },
      { id: 'ring2', position: { x: -200, y: 0 }, angle: 90 },
      { id: 'ring3', position: { x: 0, y: 200 }, angle: 0 },
      { id: 'ring4', position: { x: 200, y: 0 }, angle: -90 },
    ],
    buckles: [
      { id: 'buckle1', ringId: 'ring1', angle: -90, linkedRingId: 'ring4' },
      { id: 'buckle5', ringId: 'ring1', angle: 90, linkedRingId: 'ring2' },
      { id: 'buckle3', ringId: 'ring1', angle: 0, linkedRingId: 'ring3' },
    ],
    rocks: [],
    bombs: [],
  },
  3: {
    id: 3,
    name: 'Level 3',
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 0, y: -140 }, angle: 180 },
      { id: 'ring2', position: { x: -140, y: 0 }, angle: 45 },
      { id: 'ring3', position: { x: 140, y: 0 }, angle: -45 },
      { id: 'ring4', position: { x: 0, y: 140 }, angle: 0 },
    ],
    buckles: [
      { id: 'buckle2', ringId: 'ring1', angle: -45, linkedRingId: 'ring3' },
      { id: 'buckle4', ringId: 'ring1', angle: 45, linkedRingId: 'ring2' },
      { id: 'buckle1', ringId: 'ring3', angle: -90, linkedRingId: 'ring4' },
    ],
    rocks: [],
    bombs: [],
  },
  4: {
    id: 4,
    name: 'Level 4',
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 0, y: -100 }, angle: 2700 },
      { id: 'ring2', position: { x: 0, y: 100 }, angle: -90 },
      { id: 'ring3', position: { x: -200, y: 100 }, angle: 135 },
      { id: 'ring4', position: { x: 200, y: -100 }, angle: -90 },
    ],
    buckles: [
      { id: 'buckle3', ringId: 'ring1', angle: 0, linkedRingId: 'ring2' },
      { id: 'buckle3', ringId: 'ring2', angle: 0, linkedRingId: 'ring3' },
      { id: 'buckle3', ringId: 'ring4', angle: 0, linkedRingId: 'ring1' },
    ],
    rocks: [{ id: 'rock1', ringId: 'ring2' }],
    bombs: [{ id: 'bomb1', ringId: 'ring3', countdown: 30 }],
  },
  5: {
    id: 5,
    name: 'Level 5',
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: 0, y: 0 }, angle: -135 },
      { id: 'ring2', position: { x: 140, y: 140 }, angle: -45 },
      { id: 'ring3', position: { x: 0, y: 280 }, angle: 45 },
      { id: 'ring4', position: { x: -140, y: -140 }, angle: 135 },
      { id: 'ring5', position: { x: 0, y: -280 }, angle: -135 },
    ],
    buckles: [
      { id: 'buckle1', ringId: 'ring1', angle: -90, linkedRingId: 'ring2' },
      { id: 'buckle5', ringId: 'ring1', angle: 90, linkedRingId: 'ring4' },
      { id: 'buckle1', ringId: 'ring2', angle: -90, linkedRingId: 'ring3' },
      { id: 'buckle1', ringId: 'ring4', angle: -90, linkedRingId: 'ring5' },
    ],
    rocks: [],
    bombs: [],
  },
  6: {
    id: 6,
    name: 'Level 6',
    ringScale: 0.5,
    rings: [
      { id: 'ring1', position: { x: -200, y: 0 }, angle: 90 },
      { id: 'ring2', position: { x: 0, y: 0 }, angle: 0 },
      { id: 'ring3', position: { x: 200, y: 0 }, angle: -90 },
      { id: 'ring4', position: { x: -200, y: -200 }, angle: 180 },
      { id: 'ring5', position: { x: 200, y: 200 }, angle: 0 },
    ],
    buckles: [
      { id: 'buckle1', ringId: 'ring1', angle: -90, linkedRingId: 'ring4' },
      { id: 'buckle5', ringId: 'ring2', angle: 90, linkedRingId: 'ring3' },
      { id: 'buckle1', ringId: 'ring2', angle: -90, linkedRingId: 'ring1' },
      { id: 'buckle1', ringId: 'ring3', angle: -90, linkedRingId: 'ring5' },
    ],
    rocks: [{ id: 'rock1', ringId: 'ring4' }],
    bombs: [{ id: 'bomb1', ringId: 'ring5', countdown: 30 }],
  },
  7: {
    id: 7,
    name: 'Level 7',
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
      { id: 'buckle1', ringId: 'ring1', angle: -90, linkedRingId: 'ring2' },
      { id: 'buckle5', ringId: 'ring1', angle: 90, linkedRingId: 'ring4' },
      { id: 'buckle3', ringId: 'ring1', angle: 0, linkedRingId: 'ring3' },
      { id: 'buckle5', ringId: 'ring5', angle: 90, linkedRingId: 'ring2' },
      { id: 'buckle1', ringId: 'ring5', angle: -90, linkedRingId: 'ring8' },
      { id: 'buckle3', ringId: 'ring6', angle: 0, linkedRingId: 'ring3' },
      { id: 'buckle3', ringId: 'ring7', angle: 0, linkedRingId: 'ring4' },
    ],
    rocks: [{ id: 'rock1', ringId: 'ring8' }],
    bombs: [{ id: 'bomb1', ringId: 'ring1', countdown: 30 }],
  },
  8: {
    id: 8,
    name: 'Level 8',
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
      { id: 'buckle2', ringId: 'ring1', angle: -45, linkedRingId: 'ring11' },
      { id: 'buckle4', ringId: 'ring1', angle: 45, linkedRingId: 'ring5' },
      { id: 'buckle5', ringId: 'ring2', angle: 90, linkedRingId: 'ring12' },
      { id: 'buckle3', ringId: 'ring2', angle: 0, linkedRingId: 'ring11' },
      { id: 'buckle3', ringId: 'ring3', angle: 0, linkedRingId: 'ring7' },
      { id: 'buckle4', ringId: 'ring4', angle: 45, linkedRingId: 'ring13' },
      { id: 'buckle5', ringId: 'ring5', angle: 90, linkedRingId: 'ring8' },
      { id: 'buckle5', ringId: 'ring8', angle: 90, linkedRingId: 'ring10' },
      { id: 'buckle3', ringId: 'ring8', angle: 0, linkedRingId: 'ring6' },
      { id: 'buckle3', ringId: 'ring9', angle: 0, linkedRingId: 'ring6' },
      { id: 'buckle5', ringId: 'ring9', angle: 90, linkedRingId: 'ring7' },
      { id: 'buckle5', ringId: 'ring13', angle: 90, linkedRingId: 'ring15' },
      { id: 'buckle5', ringId: 'ring14', angle: 90, linkedRingId: 'ring11' },
      { id: 'buckle3', ringId: 'ring14', angle: 0, linkedRingId: 'ring12' },
      { id: 'buckle3', ringId: 'ring15', angle: 0, linkedRingId: 'ring12' },
      { id: 'buckle5', ringId: 'ring15', angle: 90, linkedRingId: 'ring16' },
    ],
    rocks: [],
    bombs: [],
  },
  9: { id: 9, name: 'Level 9', ringScale: 0.5, rings: [], buckles: [], rocks: [], bombs: [] },
  10: { id: 10, name: 'Level 10', ringScale: 0.5, rings: [], buckles: [], rocks: [], bombs: [] },
};

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
