/**
 * Level Runtime Manager
 */

import { _decorator, Component, Node, Vec3, instantiate, Prefab, tween, Tween, Sprite, color, UIOpacity, Quat } from 'cc';
import { BuckleConfig, LevelConfig, LevelState, RingState, BombState, RockState, FIXED_GAP_SIZE } from './Types';
import { canRingRotate, canRingRelease, shouldBombExplodeOnRelease, getLinkedRingIds, isRingConstrained } from './Rules';
import { Repo } from './Repo';
import { Ring } from './Ring';
import { Buckle } from './Buckle';

const { ccclass, property } = _decorator;

// GM is attached to window after initialization
declare const GM: any;

@ccclass('Runtime')
export class Runtime extends Component {
  @property(Prefab)
  ringPrefab: Prefab | null = null;
  @property(Prefab)
  bucklePrefab: Prefab | null = null;

  // 运行时保持与 Ring.ts 基准一致：prefab 半径 180，缩放 0.5 后实际半径 90。
  private readonly ringScale: number = 0.5;
  private readonly ringRadius: number = Ring.PREFAB_BASE_RADIUS * 0.5;
  // 旋转中心偏移（与 Ring.ts 中的 ROTATION_CENTER_OFFSET 一致）
  private readonly ringCenterOffset: Vec3 = new Vec3(0, 15, 0);
  // 释放动画配置
  private readonly releaseAnimationDuration = 0.8; // 动画总时长（秒）
  private readonly releaseScaleFactor = 1.5; // 放大倍数
  private readonly releaseMoveDistance = 100; // 移动距离

  private state: LevelState | null = null;
  private areaNode: Node | null = null;
  private buckleLayer: Node | null = null;
  private ringNodes: Map<string, Node> = new Map();
  private ringComps: Map<string, Ring> = new Map();
  private buckleNodesByRing: Map<string, Node[]> = new Map();
  private buckleCompsByRing: Map<string, Buckle[]> = new Map();

  // 释放队列：{ringId, isUserTriggered}
  private releaseQueue: Array<{ ringId: string; isUserTriggered: boolean }> = [];
  private isProcessingRelease = false;

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
      const pos = this.calculateRingPosition(ring.config.position, ring.currentAngle);
      ringNode.setPosition(pos.x, pos.y, 0);
    }
    this.syncBuckleNodes(ringId);

    if (checkRelease && canRingRelease(ring, this.state.rings, this.state.bucklesByRing)) {
      this.releaseRing(ringId, true); // 用户拖拽触发的释放
    }

    return true;
  }

  tryReleaseRing(ringId: string, isUserTriggered: boolean = false): void {
    if (!this.state) return;
    const ring = this.state.rings.get(ringId);
    if (!ring || ring.isReleased) return;
    const canRelease = canRingRelease(ring, this.state.rings, this.state.bucklesByRing);
    if (canRelease) {
      this.releaseRing(ringId, isUserTriggered);
    }
  }

  applyHintRelease(): void {
    if (!this.state) return;

    const candidateRings = Array.from(this.state.rings.values()).filter((ring) => {
      if (ring.isReleased) return false;
      return !this.releaseQueue.some((item) => item.ringId === ring.id);
    });
    if (candidateRings.length === 0) return;

    const edgeTolerance = 1e-6;
    const distanceLevels = Array.from(
      new Set(
        candidateRings.map((ring) => ring.config.position.x * ring.config.position.x + ring.config.position.y * ring.config.position.y)
      )
    ).sort((a, b) => b - a);

    const selectedIds: string[] = [];
    for (const distanceSq of distanceLevels) {
      if (selectedIds.length >= 2) break;
      const edgeRings = candidateRings.filter((ring) => {
        const ringDistanceSq = ring.config.position.x * ring.config.position.x + ring.config.position.y * ring.config.position.y;
        return Math.abs(ringDistanceSq - distanceSq) <= edgeTolerance;
      });

      const prioritized = edgeRings.filter((ring) => ring.hasBomb || ring.hasRock);
      const normal = edgeRings.filter((ring) => !ring.hasBomb && !ring.hasRock);

      const remain = 2 - selectedIds.length;
      selectedIds.push(...this.pickRandomRingIds(prioritized, remain));
      if (selectedIds.length < 2) {
        selectedIds.push(...this.pickRandomRingIds(normal, 2 - selectedIds.length));
      }
    }

    for (const ringId of selectedIds) {
      this.releaseRing(ringId, false);
    }
  }

  canSelectRing(ringId: string): boolean {
    if (!this.state) return false;
    const ring = this.state.rings.get(ringId);
    if (!ring || ring.isReleased || ring.isShaking) return false;
    if (this.releaseQueue.some(item => item.ringId === ringId)) return false;
    return true;
  }

  isRingConstrained(ringId: string): boolean {
    if (!this.state) return false;
    const ring = this.state.rings.get(ringId);
    if (!ring || ring.isReleased) return false;
    return isRingConstrained(ring, this.state.rings, this.state.bucklesByRing);
  }

  playShakeAnimation(ringId: string): void {
    const ringNode = this.ringNodes.get(ringId);
    if (!ringNode || !this.state) return;

    const ring = this.state.rings.get(ringId);
    if (!ring) return;

    // 标记为正在摇晃
    ring.isShaking = true;

    const buckleComps = this.buckleCompsByRing.get(ringId) || [];

    // 记录原始位置和旋转
    const originalPos = ringNode.position.clone();
    const originalRot = ringNode.eulerAngles.clone();

    // 停止之前的动画
    Tween.stopAllByTarget(ringNode);

    // 抖动动画配置
    const shakeDuration = 0.1;
    const shakeAngle = 5;
    const shakeOffset = 3;

    // 旋转中心（config.position）
    const center = new Vec3(ring.config.position.x, ring.config.position.y, 0);

    tween(ringNode)
      .to(shakeDuration, { angle: originalRot.z + shakeAngle, position: new Vec3(originalPos.x + shakeOffset, originalPos.y, 0) }, {
        easing: 'sineOut',
        onUpdate: () => this.syncBuckleForShake(ringId, center)
      })
      .to(shakeDuration, { angle: originalRot.z - shakeAngle, position: new Vec3(originalPos.x - shakeOffset, originalPos.y, 0) }, {
        easing: 'sineInOut',
        onUpdate: () => this.syncBuckleForShake(ringId, center)
      })
      .to(shakeDuration, { angle: originalRot.z + shakeAngle, position: new Vec3(originalPos.x + shakeOffset, originalPos.y, 0) }, {
        easing: 'sineInOut',
        onUpdate: () => this.syncBuckleForShake(ringId, center)
      })
      .to(shakeDuration, { angle: originalRot.z - shakeAngle, position: new Vec3(originalPos.x - shakeOffset, originalPos.y, 0) }, {
        easing: 'sineInOut',
        onUpdate: () => this.syncBuckleForShake(ringId, center)
      })
      .to(shakeDuration, { angle: originalRot.z + shakeAngle, position: new Vec3(originalPos.x + shakeOffset, originalPos.y, 0) }, {
        easing: 'sineInOut',
        onUpdate: () => this.syncBuckleForShake(ringId, center)
      })
      .to(shakeDuration, { angle: originalRot.z - shakeAngle, position: new Vec3(originalPos.x - shakeOffset, originalPos.y, 0) }, {
        easing: 'sineInOut',
        onUpdate: () => this.syncBuckleForShake(ringId, center)
      })
      .to(shakeDuration, { angle: originalRot.z, position: originalPos }, {
        easing: 'sineOut',
        onUpdate: () => this.syncBuckleForShake(ringId, center)
      })
      .call(() => {
        // 动画结束后重新同步 Buckle 位置
        this.syncBuckleNodes(ringId);
        // 移除摇晃标记
        if (ring) ring.isShaking = false;
      })
      .start();
  }

  private syncBuckleForShake(ringId: string, center: Vec3): void {
    const ringNode = this.ringNodes.get(ringId);
    if (!ringNode) return;
    const buckleComps = this.buckleCompsByRing.get(ringId) || [];
    // 使用Ring节点的实际旋转角度（而不是State中的currentAngle）
    const currentAngle = ringNode.eulerAngles.z;
    for (const comp of buckleComps) {
      comp.syncWithRing(center, currentAngle, this.ringScale);
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

    // 停止所有动画
    for (const ringNode of this.ringNodes.values()) {
      Tween.stopAllByTarget(ringNode);
    }

    this.areaNode.removeAllChildren();
    this.state = null;
    this.buckleLayer = null;
    this.ringNodes.clear();
    this.ringComps.clear();
    this.buckleNodesByRing.clear();
    this.buckleCompsByRing.clear();

    // 清空释放队列
    this.releaseQueue = [];
    this.isProcessingRelease = false;
  }

  private releaseRing(ringId: string, isUserTriggered: boolean = false): void {
    if (!this.state) return;

    const ring = this.state.rings.get(ringId);
    if (!ring || ring.isReleased) return;

    // 检查是否已经在队列中
    if (this.releaseQueue.some(item => item.ringId === ringId)) {
      return;
    }

    // 标记为已释放，防止重复添加
    ring.isReleased = true;

    // 用户触发的释放优先级更高，添加到队列前面
    if (isUserTriggered) {
      this.releaseQueue.unshift({ ringId, isUserTriggered });
    } else {
      this.releaseQueue.push({ ringId, isUserTriggered });
    }

    // 处理释放队列
    this.processReleaseQueue();
  }

  /**
   * 处理释放队列，按优先级播放动画
   */
  private processReleaseQueue(): void {
    if (this.isProcessingRelease || this.releaseQueue.length === 0) {
      return;
    }

    this.isProcessingRelease = true;

    const { ringId } = this.releaseQueue[0];
    this.playReleaseAnimation(ringId);
  }

  /**
   * 播放 Ring 释放动画
   * 1. 放大
   * 2. 缩小
   * 3. 向缺口相反方向移动并消失（透明度下降）
   * Buckle 临时改为 Ring 子节点来跟随动画
   */
  private playReleaseAnimation(ringId: string): void {
    const ring = this.state?.rings.get(ringId);
    const ringNode = this.ringNodes.get(ringId);

    if (!ring || !ringNode) {
      // 节点不存在，直接完成释放
      this.finishRelease(ringId);
      return;
    }

    // 获取该 Ring 的所有 Buckle 节点
    const buckleNodes = this.buckleNodesByRing.get(ringId) || [];

    // 将 Buckle 临时改为 Ring 的子节点，使其跟随动画
    for (const buckleNode of buckleNodes) {
      // 获取当前的世界位置和旋转
      const worldPos = buckleNode.getWorldPosition();
      const worldRot = new Quat();
      buckleNode.getWorldRotation(worldRot);

      // 改变父节点为 Ring（保持世界位置）
      buckleNode.setParent(ringNode, true);

      // 为 Buckle 添加 UIOpacity 组件
      let buckleOpacity = buckleNode.getComponent(UIOpacity);
      if (!buckleOpacity) {
        buckleOpacity = buckleNode.addComponent(UIOpacity);
      }
    }

    // 计算移动方向
    const moveAngleDeg = ring.currentAngle - 90;
    const moveAngleRad = (moveAngleDeg * Math.PI) / 180;

    const moveX = Math.cos(moveAngleRad) * this.releaseMoveDistance;
    const moveY = Math.sin(moveAngleRad) * this.releaseMoveDistance;

    const currentScale = ringNode.scale.x;
    const targetScale = currentScale * this.releaseScaleFactor;

    // 为 Ring 添加 UIOpacity 组件
    let opacityComp = ringNode.getComponent(UIOpacity);
    if (!opacityComp) {
      opacityComp = ringNode.addComponent(UIOpacity);
    }
    const currentOpacity = opacityComp.opacity;

    tween(ringNode)
      .to(this.releaseAnimationDuration * 0.3, { scale: new Vec3(targetScale, targetScale, 1) }) // 放大
      .to(this.releaseAnimationDuration * 0.3, { scale: new Vec3(currentScale, currentScale, 1) }) // 缩小
      .call(() => {
        // 开始移动并消失（透明度下降）
        const currentPos = ringNode.position.clone();
        const targetPos = new Vec3(
          currentPos.x + moveX,
          currentPos.y + moveY,
          0
        );

        tween(ringNode)
          .to(this.releaseAnimationDuration * 0.4, {
            position: targetPos
          }, {
            onUpdate: (target: Node, ratio: number) => {
              // 透明度从 currentOpacity 降到 0（Ring 和子节点 Buckle 都会受影响）
              const comp = target.getComponent(UIOpacity);
              if (comp) {
                comp.opacity = Math.floor(currentOpacity * (1 - ratio));
              }
            }
          })
          .call(() => {
            this.finishRelease(ringId);
          })
          .start();
      })
      .start();
  }

  /**
   * 完成释放，清理资源并触发连锁释放
   */
  private finishRelease(ringId: string): void {
    if (!this.state) return;

    // 处理炸弹
    for (const [id, bomb] of this.state.bombs) {
      if (shouldBombExplodeOnRelease(bomb, ringId)) {
        this.explodeBomb(id);
      }
    }

    // 销毁 Ring 节点（Buckle 作为子节点会一起被销毁）
    const ringNode = this.ringNodes.get(ringId);
    if (ringNode) {
      Tween.stopAllByTarget(ringNode);
      ringNode.destroy();
      this.ringNodes.delete(ringId);
    }

    // 清理 Buckle 映射（节点已随 Ring 一起销毁）
    this.buckleNodesByRing.delete(ringId);
    this.buckleCompsByRing.delete(ringId);
    this.ringComps.delete(ringId);

    // 从队列中移除
    this.releaseQueue.shift();
    this.isProcessingRelease = false;

    // 检查并添加连锁释放的 Ring
    const linkedIds = getLinkedRingIds(ringId, this.state.bucklesByRing);
    for (const linkedId of linkedIds) {
      // 检查是否已经在队列中
      if (!this.releaseQueue.some(item => item.ringId === linkedId)) {
        const linkedRing = this.state.rings.get(linkedId);
        if (linkedRing && !linkedRing.isReleased) {
          this.tryReleaseRing(linkedId, false); // 连锁释放，不是用户触发
        }
      }
    }

    // 继续处理队列中的下一个
    this.processReleaseQueue();

    // 检查是否所有 Ring 都已释放（关卡完成）
    this.checkLevelComplete();
  }

  /**
   * 检查关卡是否完成（所有 Ring 都已释放）
   */
  private checkLevelComplete(): void {
    if (!this.state) return;

    // 检查是否所有 Ring 都已释放
    const allReleased = Array.from(this.state.rings.values()).every(ring => ring.isReleased);
    const releaseAnimationsFinished = this.releaseQueue.length === 0 && !this.isProcessingRelease;
    if (allReleased && releaseAnimationsFinished) {
      // 触发关卡完成事件
      GM.event.emit('levelComplete');
    }
  }

  private pickRandomRingIds(rings: RingState[], count: number): string[] {
    if (count <= 0 || rings.length === 0) return [];
    const pool = [...rings];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.min(count, pool.length)).map((ring) => ring.id);
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
        isShaking: false,
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
    const pos = this.calculateRingPosition(ringState.config.position, ringState.currentAngle);
    ringNode.setPosition(pos.x, pos.y, 0);
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
    const ringState = this.state?.rings.get(ringId);
    if (!ringState) return;
    const buckleComps = this.buckleCompsByRing.get(ringId) || [];
    // 旋转中心就是 config.position
    const center = new Vec3(ringState.config.position.x, ringState.config.position.y, 0);

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

  /**
   * 计算 Ring 节点位置，使其围绕旋转中心 (0, 15) 旋转
   * @param center 旋转中心（config.position）
   * @param angleDeg 当前旋转角度（度）
   * @returns Ring 节点应该设置的位置
   */
  private calculateRingPosition(center: { x: number; y: number }, angleDeg: number): { x: number; y: number } {
    const offsetX = this.ringCenterOffset.x * this.ringScale;
    const offsetY = this.ringCenterOffset.y * this.ringScale;
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    // 旋转后的偏移向量
    const rotatedOffsetX = offsetX * cos - offsetY * sin;
    const rotatedOffsetY = offsetX * sin + offsetY * cos;
    // Ring 节点位置 = 旋转中心 - 旋转后的偏移
    return {
      x: center.x - rotatedOffsetX,
      y: center.y - rotatedOffsetY
    };
  }

}

