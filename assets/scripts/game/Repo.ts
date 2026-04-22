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
            "x": -110,
            "y": -160
          },
          "angle": 180,
          "gapSize": 45,
          "buckles": [
            {
              "id": "buckle2",
              "angle": -45,
              "linkedRingId": "ring2"
            }
          ]
        },
        {
          "id": "ring2",
          "position": {
            "x": 0,
            "y": 0
          },
          "angle": 0,
          "gapSize": 45,
          "buckles": []
        },
        {
          "id": "ring3",
          "position": {
            "x": 110,
            "y": -160
          },
          "angle": 180,
          "gapSize": 45,
          "buckles": [
            {
              "id": "buckle5",
              "angle": 90,
              "linkedRingId": "ring1"
            }
          ]
        }
      ],
      "rocks": [],
      "bombs": []
    };
  }

  private static createLevel2(): LevelConfig {
    return {
      id: 2,
      name: 'Level 2',
      rings: [
        {
          id: 'ring1',
          position: { x: 0, y: 0 },
          angle: 20,
          gapSize: 45,
          buckles: [
            { id: 'buckle1', angle: 35, linkedRingId: 'ring2' }
          ]
        },
        {
          id: 'ring2',
          position: { x: 0, y: 0 },
          angle: 110,
          gapSize: 45,
          buckles: [
            { id: 'buckle2', angle: 210, linkedRingId: 'ring3' }
          ]
        },
        {
          id: 'ring3',
          position: { x: 0, y: 0 },
          angle: 220,
          gapSize: 45,
          buckles: [
            { id: 'buckle3', angle: 300, linkedRingId: 'ring4' }
          ]
        },
        {
          id: 'ring4',
          position: { x: 0, y: 0 },
          angle: 310,
          gapSize: 45,
          buckles: []
        }
      ],
      rocks: [],
      bombs: []
    };
  }
}

