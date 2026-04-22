/**
 * Level Runtime Manager
 */

import { _decorator, Component, Node, Vec3, instantiate, Prefab } from 'cc';
import { BuckleConfig, LevelConfig, LevelState, RingState, BombState, RockState } from './Types';
import { canRingRotate, canRingRelease, shouldBombExplodeOnRelease } from './Rules';
import { Repo } from './Repo';
import { Ring } from './Ring';
import { Buckle } from './Buckle';

const { ccclass, property } = _decorator;

@ccclass('Runtime')
export class Runtime extends Component {
  @property(Prefab)
  ringPrefab: Prefab | null = null;
  @property(Prefab)
  bucklePrefab: Prefab | null = null;

  // 运行时保持与 Ring.ts 基准一致：prefab 半径 180，缩放 0.5 后实际半径 90。
  private readonly ringScale: number = 0.5;
  private readonly ringRadius: number = Ring.PREFAB_BASE_RADIUS * 0.5;

  @property
  ringCenterOffsetX: number = 0;

  @property
  ringCenterOffsetY: number = 20;

  private state: LevelState | null = null;
  private areaNode: Node | null = null;
  private buckleLayer: Node | null = null;
  private ringNodes: Map<string, Node> = new Map();
  private ringComps: Map<string, Ring> = new Map();
  private buckleNodesByRing: Map<string, Node[]> = new Map();
  private buckleCompsByRing: Map<string, Buckle[]> = new Map();

  loadLevel(level: number, areaNode: Node): void {
    if (!areaNode) {
      throw new Error('Runtime.loadLevel 缺少 Area 节点');
    }
    if (!this.ringPrefab) {
      throw new Error('Runtime 缺少 ringPrefab 绑定');
    }
    if (!this.bucklePrefab) {
      throw new Error('Runtime 缺少 bucklePrefab 绑定');
    }
    const config = Repo.get(level);
    this.areaNode = areaNode;
    this.ensureBuckleLayer();
    this.state = this.createState(config);
    this.spawnEntities();
  }

  rotateRing(ringId: string, angleDelta: number, checkRelease: boolean = true): boolean {
    if (!this.state) return false;

    const ring = this.state.rings.get(ringId);
    if (!ring) return false;
    if (!canRingRotate(ring, this.state.rings, this.state.bucklesByRing)) return false;

    ring.currentAngle = ring.currentAngle + angleDelta;
    const ringNode = this.ringNodes.get(ringId);
    if (ringNode) {
      ringNode.setRotationFromEuler(0, 0, ring.currentAngle);
    }
    this.syncBuckleNodes(ringId);

    if (checkRelease && canRingRelease(ring, this.state.rings, this.state.bucklesByRing)) {
      this.releaseRing(ringId);
    }

    return true;
  }

  tryReleaseRing(ringId: string): void {
    if (!this.state) return;
    const ring = this.state.rings.get(ringId);
    if (!ring || ring.isReleased) return;
    if (canRingRelease(ring, this.state.rings, this.state.bucklesByRing)) {
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
    this.buckleLayer = null;
    this.ringNodes.clear();
    this.ringComps.clear();
    this.buckleNodesByRing.clear();
    this.buckleCompsByRing.clear();
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
    const buckleNodes = this.buckleNodesByRing.get(ringId) || [];
    for (const buckleNode of buckleNodes) {
      buckleNode.destroy();
    }
    this.buckleNodesByRing.delete(ringId);
    this.buckleCompsByRing.delete(ringId);
    this.ringComps.delete(ringId);
  }

  private createState(config: LevelConfig): LevelState {
    const rings = new Map<string, RingState>();
    const bucklesByRing = new Map<string, BuckleConfig[]>();
    const rocks = new Map<string, RockState>();
    const bombs = new Map<string, BombState>();

    for (const ringConfig of config.rings) {
      rings.set(ringConfig.id, {
        id: ringConfig.id,
        config: ringConfig,
        currentAngle: ringConfig.angle,
        hasRock: false,
        hasBomb: false,
        isReleased: false,
        colorIndex: Math.floor(Math.random() * 7) + 1
      });
    }

    for (const buckle of config.buckles) {
      if (!rings.has(buckle.ringId)) {
        throw new Error(`Buckle 绑定的 ring 不存在: ${buckle.ringId}`);
      }
      const list = bucklesByRing.get(buckle.ringId);
      if (list) {
        list.push(buckle);
      } else {
        bucklesByRing.set(buckle.ringId, [buckle]);
      }
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

    return { config, rings, bucklesByRing, rocks, bombs };
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
    ringNode.setScale(this.ringScale, this.ringScale, 1);
    ringNode.setRotationFromEuler(0, 0, ringState.currentAngle);
    const bucklesRoot = ringNode.getChildByName('Buckles');
    if (bucklesRoot) {
      bucklesRoot.active = false;
    }
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
    ringComp.setRockVisible(ringState.hasRock);
    ringComp.setBombVisible(ringState.hasBomb);
    this.spawnStandaloneBuckles(ringState.id);
    this.ensureBuckleLayerTopmost();

    if (ringState.hasBomb) {
      const bombState = Array.from(this.state!.bombs.values()).find((item) => item.config.ringId === ringState.id);
      if (bombState) {
        ringComp.armBombTimeout(bombState.id, bombState.config.countdown ?? 30);
      }
    }
  }

  private spawnStandaloneBuckles(ringId: string): void {
    if (!this.buckleLayer) {
      throw new Error('Runtime.spawnStandaloneBuckles 缺少 buckleLayer');
    }
    if (!this.bucklePrefab) {
      throw new Error('Runtime.spawnStandaloneBuckles 缺少 bucklePrefab');
    }
    const configs = this.state?.bucklesByRing.get(ringId) || [];
    const buckleNodes: Node[] = [];
    const buckleComps: Buckle[] = [];

    for (const cfg of configs) {
      const buckleNode = instantiate(this.bucklePrefab);
      const buckleComp = buckleNode.getComponent(Buckle);
      if (!buckleComp) {
        throw new Error('bucklePrefab 缺少 Buckle 组件');
      }
      buckleComp.setup(cfg, this.ringScale);
      buckleNode.active = true;
      this.buckleLayer.addChild(buckleNode);
      buckleNodes.push(buckleNode);
      buckleComps.push(buckleComp);
    }

    this.buckleNodesByRing.set(ringId, buckleNodes);
    this.buckleCompsByRing.set(ringId, buckleComps);
    this.syncBuckleNodes(ringId);
    this.ensureBuckleLayerTopmost();
  }

  private syncBuckleNodes(ringId: string): void {
    const ringNode = this.ringNodes.get(ringId);
    const ringState = this.state?.rings.get(ringId);
    if (!ringNode || !ringState) return;
    const buckleComps = this.buckleCompsByRing.get(ringId) || [];
    const center = ringNode.position;

    for (const comp of buckleComps) {
      comp.syncWithRing(center, ringState.currentAngle, this.ringScale);
    }
  }

  private ensureBuckleLayer(): void {
    if (!this.areaNode) {
      throw new Error('Runtime.ensureBuckleLayer 缺少 areaNode');
    }
    const existed = this.areaNode.getChildByName('BuckleLayer');
    if (existed) {
      this.buckleLayer = existed;
    } else {
      this.buckleLayer = new Node('BuckleLayer');
      this.areaNode.addChild(this.buckleLayer);
    }
    this.ensureBuckleLayerTopmost();
  }

  private ensureBuckleLayerTopmost(): void {
    if (!this.areaNode || !this.buckleLayer) return;
    this.buckleLayer.setSiblingIndex(this.areaNode.children.length - 1);
  }

}

