/**
 * Level Runtime Manager
 */

import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
import { LevelConfig, LevelState, RingState, BombState, RockState } from './Types';
import { canRingRotate, canRingRelease, shouldBombExplodeOnRelease } from './Rules';
import { Repo } from './Repo';
import { Ring } from './Ring';

const { ccclass, property } = _decorator;

@ccclass('Runtime')
export class Runtime extends Component {
  @property(Prefab)
  ringPrefab: Prefab | null = null;

  private readonly ringRadius: number = 100;

  @property
  ringCenterOffsetX: number = 0;

  @property
  ringCenterOffsetY: number = 20;

  private state: LevelState | null = null;
  private areaNode: Node | null = null;
  private ringNodes: Map<string, Node> = new Map();
  private ringComps: Map<string, Ring> = new Map();

  loadLevel(level: number, areaNode: Node): void {
    if (!areaNode) {
      throw new Error('Runtime.loadLevel 缺少 Area 节点');
    }
    if (!this.ringPrefab) {
      throw new Error('Runtime 缺少 ringPrefab 绑定');
    }
    const config = Repo.get(level);
    this.areaNode = areaNode;
    this.state = this.createState(config);
    this.spawnEntities();
  }

  rotateRing(ringId: string, angleDelta: number, checkRelease: boolean = true): boolean {
    if (!this.state) return false;

    const ring = this.state.rings.get(ringId);
    if (!ring) return false;
    if (!canRingRotate(ring, this.state.rings)) return false;

    ring.currentAngle = (ring.currentAngle + angleDelta) % 360;

    if (checkRelease && canRingRelease(ring, this.state.rings)) {
      this.releaseRing(ringId);
    }

    return true;
  }

  tryReleaseRing(ringId: string): void {
    if (!this.state) return;
    const ring = this.state.rings.get(ringId);
    if (!ring || ring.isReleased) return;
    if (canRingRelease(ring, this.state.rings)) {
      this.releaseRing(ringId);
    }
  }

  explodeBomb(bombId: string): void {
    if (!this.state) return;

    const bomb = this.state.bombs.get(bombId);
    if (!bomb || bomb.isExploded) return;

    bomb.isExploded = true;

    for (const [id, rock] of this.state.rocks) {
      if (rock.isDestroyed) continue;
      this.destroyRock(id);
    }

    const hostRingComp = this.ringComps.get(bomb.config.ringId);
    hostRingComp?.setBombVisible(false);
  }

  handleBombTimeout(bombId: string): void {
    if (!this.state) return;
    const bomb = this.state.bombs.get(bombId);
    if (!bomb || bomb.isExploded) return;
    bomb.isExploded = true;
    const ring = this.state.rings.get(bomb.config.ringId);
    if (ring) {
      ring.hasBomb = false;
    }
  }

  destroyRock(rockId: string): void {
    if (!this.state) return;

    const rock = this.state.rocks.get(rockId);
    if (!rock || rock.isDestroyed) return;

    rock.isDestroyed = true;
    const ring = this.state.rings.get(rock.config.ringId);
    if (ring) {
      ring.hasRock = false;
    }
    this.ringComps.get(rock.config.ringId)?.setRockVisible(false);
  }

  clear(): void {
    if (!this.areaNode) return;
    this.areaNode.removeAllChildren();
    this.state = null;
    this.ringNodes.clear();
    this.ringComps.clear();
  }

  private releaseRing(ringId: string): void {
    if (!this.state) return;

    const ring = this.state.rings.get(ringId);
    if (!ring || ring.isReleased) return;
    ring.isReleased = true;

    for (const [id, bomb] of this.state.bombs) {
      if (shouldBombExplodeOnRelease(bomb, ringId)) {
        this.explodeBomb(id);
      }
    }

    const ringNode = this.ringNodes.get(ringId);
    if (ringNode) {
      ringNode.destroy();
      this.ringNodes.delete(ringId);
    }
    this.ringComps.delete(ringId);
  }

  private createState(config: LevelConfig): LevelState {
    const rings = new Map<string, RingState>();
    const rocks = new Map<string, RockState>();
    const bombs = new Map<string, BombState>();

    for (const ringConfig of config.rings) {
      rings.set(ringConfig.id, {
        id: ringConfig.id,
        config: ringConfig,
        currentAngle: 0,
        hasRock: false,
        hasBomb: false,
        isReleased: false,
        colorIndex: Math.floor(Math.random() * 7) + 1
      });
    }

    for (const rockConfig of config.rocks) {
      rocks.set(rockConfig.id, {
        id: rockConfig.id,
        config: rockConfig,
        isDestroyed: false
      });
      const ring = rings.get(rockConfig.ringId);
      if (ring) ring.hasRock = true;
    }

    for (const bombConfig of config.bombs) {
      bombs.set(bombConfig.id, {
        id: bombConfig.id,
        config: bombConfig,
        isExploded: false
      });
      const ring = rings.get(bombConfig.ringId);
      if (ring) ring.hasBomb = true;
    }

    return { config, rings, rocks, bombs };
  }

  private spawnEntities(): void {
    if (!this.state || !this.areaNode) return;
    for (const ringState of this.state.rings.values()) {
      if (!ringState.isReleased) this.spawnRing(ringState);
    }
  }

  private spawnRing(ringState: RingState): void {
    if (!this.areaNode) {
      throw new Error('Runtime.spawnRing 缺少 areaNode');
    }
    if (!this.ringPrefab) {
      throw new Error('Runtime.spawnRing 缺少 ringPrefab');
    }

    const ringNode = instantiate(this.ringPrefab);
    ringNode.setPosition(
      ringState.config.position.x + this.ringCenterOffsetX,
      ringState.config.position.y + this.ringCenterOffsetY,
      0
    );
    ringNode.setScale(0.5, 0.5, 1);
    ringNode.name = ringState.id;
    this.areaNode.addChild(ringNode);
    this.ringNodes.set(ringState.id, ringNode);

    const ringComp = ringNode.getComponent(Ring);
    if (!ringComp) {
      throw new Error('Ring prefab 缺少 Ring 组件');
    }
    this.ringComps.set(ringState.id, ringComp);

    ringComp.setup(this, ringState.id, this.ringRadius);
    ringComp.setRingColor(ringState.colorIndex);
    ringComp.setSelectedVisible(false);
    ringComp.setGapPolar(this.ringRadius, ringState.config.gapAngle);
    ringComp.syncBucklesVisible(ringState.config.buckles);
    ringComp.setRockVisible(ringState.hasRock);
    ringComp.setBombVisible(ringState.hasBomb);

    if (ringState.hasBomb) {
      const bombState = Array.from(this.state!.bombs.values()).find((item) => item.config.ringId === ringState.id);
      if (bombState) {
        ringComp.armBombTimeout(bombState.id, bombState.config.countdown ?? 30);
      }
    }
  }
}

