/**
 * Level Configuration Types
 */

export interface RingConfig {
  id: string;
  position: { x: number; y: number };
  angle: number;
}

export interface BuckleConfig {
  id: string;
  ringId: string;
  angle: number;
  linkedRingId?: string;
}

export interface RockConfig {
  id: string;
  ringId: string;
}

export interface BombConfig {
  id: string;
  ringId: string;
  countdown?: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  rings: RingConfig[];
  buckles: BuckleConfig[];
  rocks: RockConfig[];
  bombs: BombConfig[];
}

export interface RingState {
  id: string;
  config: RingConfig;
  currentAngle: number;
  hasRock: boolean;
  hasBomb: boolean;
  isReleased: boolean;
  isShaking: boolean;
  colorIndex: number;
}

export interface BombState {
  id: string;
  config: BombConfig;
  isExploded: boolean;
}

export interface RockState {
  id: string;
  config: RockConfig;
  isDestroyed: boolean;
}

export interface LevelState {
  config: LevelConfig;
  rings: Map<string, RingState>;
  bucklesByRing: Map<string, BuckleConfig[]>;
  bombs: Map<string, BombState>;
  rocks: Map<string, RockState>;
}

export const FIXED_GAP_SIZE = 45;
// 释放判定容差（度），放宽判定条件
export const RELEASE_TOLERANCE = 5;

