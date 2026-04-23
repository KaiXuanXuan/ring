/**
 * Level Repository
 */

import { LevelConfig } from './Types';

export class Repo {
  private static levels: Map<number, LevelConfig> = new Map();

  static init(): void {
    this.levels.set(1, this.createLevel1());
    this.levels.set(2, this.createLevel2());
    this.levels.set(3, this.createLevel3());
    this.levels.set(4, this.createLevel4());
    this.levels.set(5, this.createLevel5());
    this.levels.set(6, this.createLevel6());
    this.levels.set(7, this.createLevel7());
    this.levels.set(8, this.createLevel8());
    this.levels.set(9, this.createLevel9());
    this.levels.set(10, this.createLevel10());
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
            "y": -140
          },
          "angle": 180
        },
        {
          "id": "ring2",
          "position": {
            "x": -140,
            "y": 0
          },
          "angle": 45
        },
        {
          "id": "ring3",
          "position": {
            "x": 140,
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
      "id": 2,
      "name": "Level 2",
      "rings": [
        {
          "id": "ring1",
          "position": {
            "x": 0,
            "y": 0
          },
          "angle": 180
        },
        {
          "id": "ring2",
          "position": {
            "x": -200,
            "y": 0
          },
          "angle": 90
        },
        {
          "id": "ring3",
          "position": {
            "x": 0,
            "y": 200
          },
          "angle": 0
        },
        {
          "id": "ring4",
          "position": {
            "x": 200,
            "y": 0
          },
          "angle": -90
        }
      ],
      "buckles": [
        {
          "id": "buckle1",
          "ringId": "ring1",
          "angle": -90,
          "linkedRingId": "ring4"
        },
        {
          "id": "buckle5",
          "ringId": "ring1",
          "angle": 90,
          "linkedRingId": "ring2"
        },
        {
          "id": "buckle3",
          "ringId": "ring1",
          "angle": 0,
          "linkedRingId": "ring3"
        }
      ],
      "rocks": [],
      "bombs": []
    };
  }
  private static createLevel3(): LevelConfig {
    return {
      "id": 3,
      "name": "Level 3",
      "rings": [
        {
          "id": "ring1",
          "position": {
            "x": 0,
            "y": -140
          },
          "angle": 180
        },
        {
          "id": "ring2",
          "position": {
            "x": -140,
            "y": 0
          },
          "angle": 45
        },
        {
          "id": "ring3",
          "position": {
            "x": 140,
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
          "angle": -90,
          "linkedRingId": "ring4"
        }
      ],
      "rocks": [],
      "bombs": []
    };
  }

  private static createLevel4(): LevelConfig {
    return {
      "id": 4,
      "name": "Level 4",
      "rings": [],
      "buckles": [],
      "rocks": [],
      "bombs": []
    };
  }

  private static createLevel5(): LevelConfig {
    return {
      "id": 5,
      "name": "Level 5",
      "rings": [],
      "buckles": [],
      "rocks": [],
      "bombs": []
    };
  }

  private static createLevel6(): LevelConfig {
    return {
      "id": 6,
      "name": "Level 6",
      "rings": [],
      "buckles": [],
      "rocks": [],
      "bombs": []
    };
  }

  private static createLevel7(): LevelConfig {
    return {
      "id": 7,
      "name": "Level 7",
      "rings": [],
      "buckles": [],
      "rocks": [],
      "bombs": []
    };
  }

  private static createLevel8(): LevelConfig {
    return {
      "id": 8,
      "name": "Level 8",
      "rings": [],
      "buckles": [],
      "rocks": [],
      "bombs": []
    };
  }

  private static createLevel9(): LevelConfig {
    return {
      "id": 9,
      "name": "Level 9",
      "rings": [],
      "buckles": [],
      "rocks": [],
      "bombs": []
    };
  }

  private static createLevel10(): LevelConfig {
    return {
      "id": 10,
      "name": "Level 10",
      "rings": [],
      "buckles": [],
      "rocks": [],
      "bombs": []
    };
  }
}

