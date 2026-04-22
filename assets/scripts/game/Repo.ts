/**
 * Level Repository
 */

import { LevelConfig } from './Types';

export class Repo {
  private static levels: Map<number, LevelConfig> = new Map();

  static init(): void {
    this.levels.set(1, this.createLevel1());
    this.levels.set(2, this.createLevel2());
  }

  static get(id: number): LevelConfig {
    const level = this.levels.get(id);
    if (!level) {
      throw new Error(`Level not found: ${id}`);
    }
    return level;
  }

  static getAllIds(): number[] {
    return Array.from(this.levels.keys());
  }

  private static createLevel1(): LevelConfig {
    return {
      "id": 1,
      "name": "Level 1",
      "rings": [
        {
          "id": "ring1",
          "position": {
            "x": 0,
            "y": -135
          },
          "angle": 180
        },
        {
          "id": "ring2",
          "position": {
            "x": -135,
            "y": 0
          },
          "angle": 45
        },
        {
          "id": "ring3",
          "position": {
            "x": 135,
            "y": 0
          },
          "angle": -45
        }
      ],
      "buckles": [
        {
          "id": "buckle2",
          "ringId": "ring1",
          "angle": -45,
          "linkedRingId": "ring3"
        },
        {
          "id": "buckle4",
          "ringId": "ring1",
          "angle": 45,
          "linkedRingId": "ring2"
        }
      ],
      "rocks": [],
      "bombs": []
    };
  }

  private static createLevel2(): LevelConfig {
    return {
      "id": 1,
      "name": "Level 1",
      "rings": [
        {
          "id": "ring1",
          "position": {
            "x": 0,
            "y": -135
          },
          "angle": 180
        },
        {
          "id": "ring2",
          "position": {
            "x": -135,
            "y": 0
          },
          "angle": 45
        },
        {
          "id": "ring3",
          "position": {
            "x": 135,
            "y": 0
          },
          "angle": -45
        },
        {
          "id": "ring4",
          "position": {
            "x": 0,
            "y": 140
          },
          "angle": 0
        }
      ],
      "buckles": [
        {
          "id": "buckle2",
          "ringId": "ring1",
          "angle": -45,
          "linkedRingId": "ring3"
        },
        {
          "id": "buckle4",
          "ringId": "ring1",
          "angle": 45,
          "linkedRingId": "ring2"
        },
        {
          "id": "buckle1",
          "ringId": "ring3",
          "angle": -90
        }
      ],
      "rocks": [],
      "bombs": []
    };
  }
}

