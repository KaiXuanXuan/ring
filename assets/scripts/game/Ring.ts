import { _decorator, Component, EventTouch, Input, Mat4, Node, Sprite, SpriteFrame, Vec2, Vec3, input, resources } from 'cc';
import { Runtime } from './Runtime';

const { ccclass, property } = _decorator;

@ccclass('Ring')
export class Ring extends Component {
  // Ring.prefab 尺寸约 380x359，基准半径按 180 计算。
  public static readonly PREFAB_BASE_RADIUS: number = 180;
  // 旋转中心偏移（本地坐标）
  private static readonly ROTATION_CENTER_OFFSET: Vec3 = new Vec3(0, 15, 0);

  @property
  rotationSpeed: number = 1;

  private radius: number = 180;

  private runtime: Runtime | null = null;
  private ringId: string = '';
  private isDragging: boolean = false;
  private lastTouchPos: Vec2 = new Vec2();
  private startAngle: number = 0;
  private bombId: string | null = null;

  private bombNode: Node | null = null;
  private selectedNode: Node | null = null;
  private gapNode: Node | null = null;
  private static activeDraggingRingId: string | null = null;

  onLoad(): void {
    this.cacheNodes();
    input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  onDestroy(): void {
    input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    this.unschedule(this.onBombTimeout);
    if (Ring.activeDraggingRingId === this.ringId) {
      Ring.activeDraggingRingId = null;
    }
  }

  setup(runtime: Runtime, ringId: string, radius: number): void {
    this.runtime = runtime;
    this.ringId = ringId;
    this.radius = radius;
  }

  setRingColor(colorIndex: number): void {
    const sprite = this.getComponent(Sprite);
    if (!sprite) return;
    resources.load(`ring/${colorIndex}/spriteFrame`, SpriteFrame, (err, frame) => {
      if (err || !frame) {
        throw new Error(`加载锁环颜色失败: ${colorIndex}`);
      }
      sprite.spriteFrame = frame;
    });
  }

  setSelectedVisible(visible: boolean): void {
    if (!this.selectedNode) throw new Error('Ring 缺少 Selected 节点');
    this.selectedNode.active = visible;
  }

  setRockVisible(visible: boolean): void {
    if (!this.gapNode) throw new Error('Ring 缺少 Gap 节点');
    this.gapNode.active = visible;
  }

  setBombVisible(visible: boolean): void {
    if (!this.bombNode) throw new Error('Ring 缺少 Bomb 节点');
    this.bombNode.active = visible;
    if (!visible) {
      this.unschedule(this.onBombTimeout);
      this.bombId = null;
    }
  }

  armBombTimeout(bombId: string, timeoutSec: number): void {
    this.unschedule(this.onBombTimeout);
    this.bombId = bombId;
    this.scheduleOnce(this.onBombTimeout, timeoutSec);
  }

  private onBombTimeout = (): void => {
    if (!this.runtime || !this.bombId) return;
    const bombId = this.bombId;
    this.bombId = null;
    this.setBombVisible(false);
    this.runtime.handleBombTimeout(bombId);
  };

  private cacheNodes(): void {
    this.bombNode = this.node.getChildByName('Bomb');
    this.selectedNode = this.node.getChildByName('Selected');
    this.gapNode = this.node.getChildByName('Gap');
    if (!this.bombNode || !this.selectedNode || !this.gapNode) {
      throw new Error('Ring 预制体缺少子节点: Bomb/Selected/Gap');
    }
  }

  private onTouchStart(event: EventTouch): void {
    if (Ring.activeDraggingRingId && Ring.activeDraggingRingId !== this.ringId) return;
    if (!this.isTouchOnNode(event)) return;
    this.isDragging = true;
    Ring.activeDraggingRingId = this.ringId;
    const pos = event.getUILocation();
    this.lastTouchPos.set(pos.x, pos.y);
    this.startAngle = this.node.eulerAngles.z;
    this.setSelectedVisible(true);
  }

  private onTouchMove(event: EventTouch): void {
    if (!this.isDragging || !this.runtime) return;
    const pos = event.getUILocation();
    const currentPos = new Vec2(pos.x, pos.y);
    const delta = this.calculateAngleDelta(this.lastTouchPos, currentPos);
    const appliedDelta = delta * this.rotationSpeed;
    if (this.runtime.rotateRing(this.ringId, appliedDelta, false)) {
      const newAngle = this.startAngle + appliedDelta;
      this.node.setRotationFromEuler(0, 0, newAngle);
      this.startAngle = newAngle;
    }
    this.lastTouchPos.set(currentPos);
  }

  private onTouchEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (Ring.activeDraggingRingId === this.ringId) {
      Ring.activeDraggingRingId = null;
    }
    this.setSelectedVisible(false);
    if (this.runtime) {
      this.runtime.tryReleaseRing(this.ringId, true); // 用户触发释放
    }
  }

  private isTouchOnNode(event: EventTouch): boolean {
    const pos = event.getUILocation();
    const touchPos = new Vec2(pos.x, pos.y);
    const worldPos = this.getInteractionCenterWorld();
    const dx = touchPos.x - worldPos.x;
    const dy = touchPos.y - worldPos.y;
    return dx * dx + dy * dy < this.radius * this.radius;
  }

  private calculateAngleDelta(from: Vec2, to: Vec2): number {
    const worldPos = this.getInteractionCenterWorld();
    const vec1 = new Vec2(from.x - worldPos.x, from.y - worldPos.y);
    const vec2 = new Vec2(to.x - worldPos.x, to.y - worldPos.y);
    Vec2.normalize(vec1, vec1);
    Vec2.normalize(vec2, vec2);
    const dot = Vec2.dot(vec1, vec2);
    const cross = vec1.x * vec2.y - vec1.y * vec2.x;
    let angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
    if (cross < 0) angle = -angle;
    return angle;
  }

  private getInteractionCenterWorld(): Vec3 {
    const wm = new Mat4();
    this.node.getWorldMatrix(wm);
    const worldCenter = new Vec3();
    Vec3.transformMat4(worldCenter, Ring.ROTATION_CENTER_OFFSET, wm);
    return worldCenter;
  }
}

