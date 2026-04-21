/**
 * Level Configuration Types
 */

export interface RingConfig {
  id: string;
  position: { x: number; y: number };
  gapAngle: number;
  gapSize: number;
  buckles: BuckleConfig[];
}

export interface BuckleConfig {
  id: string;
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
  bombs: Map<string, BombState>;
  rocks: Map<string, RockState>;
}

