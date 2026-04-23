import {
  _decorator,
  Animation,
  BlockInputEvents,
  Color,
  Component,
  EventTouch,
  Graphics,
  Input,
  Layers,
  Mat4,
  Node,
  Sprite,
  SpriteFrame,
  UITransform,
  Vec3,
  Prefab,
  instantiate,
  input,
  resources,
} from 'cc';
import { Repo } from '../game/Repo';

const { ccclass, property } = _decorator;

declare const GM: any;

type GuideStep = 0 | 1 | 2;

@ccclass('Guide')
export class Guide extends Component {
  @property(Prefab)
  guideHandPrefab: Prefab | null = null;

  private readonly tipOffsetY = -300;
  private readonly tipPathStep1 = 'ui/text/所有的锁环需要在 规定的时间内解锁';
  private readonly tipPathStep2 = 'ui/text/旋转锁环使锁环与卡扣 对齐，锁环将被解锁。';
  private readonly ringInteractionCenterOffset = new Vec3(0, 15, 0);
  private readonly guideDialogPath = 'prefab/GuideDialog';

  private step: GuideStep = 0;
  private maskLayer: Node | null = null;
  private spotlight: Node | null = null;
  private gestureAnchor: Node | null = null;
  private tip: Node | null = null;
  private topMask: Node | null = null;
  private bottomMask: Node | null = null;
  private leftMask: Node | null = null;
  private rightMask: Node | null = null;
  private handNode: Node | null = null;
  private tipSprite: Sprite | null = null;
  private progressNode: Node | null = null;
  private ringId = 'ring3';
  private tipFrameStep1: SpriteFrame | null = null;
  private tipFrameStep2: SpriteFrame | null = null;
  private tipFramesReady = false;
  private pendingLevel1Guide = false;
  private countdownPausedByGuide = false;
  private firstBombLevel = -1;
  private bombGuideDialogOpening = false;
  private readonly onStartLevelHandler = () => {
    this.checkLevelGuide();
  };

  private readonly onRingReleasedHandler = (data?: { ringId?: string }) => {
    if (this.step !== 2) return;
    if (data?.ringId === this.ringId) {
      this.stopGuide();
    }
  };

  private readonly onGuideDialogClosedHandler = () => {
    this.resumeCountdown();
    this.bombGuideDialogOpening = false;
  };

  onLoad(): void {
    this.firstBombLevel = Repo.getFirstBombLevelId();
    this.setupGuideNodes();
    this.node.active = false;
    GM.event.on('startLevel', this.onStartLevelHandler);
    GM.event.on('ringReleased', this.onRingReleasedHandler);
    GM.event.on('guideDialogClosed', this.onGuideDialogClosedHandler);
    input.on(Input.EventType.TOUCH_END, this.onMaskTouchEnd, this);
    this.checkLevelGuide();
    this.initTipFrames();
  }

  private initTipFrames(): void {
    void Promise.all([
      this.loadTextFrame(this.tipPathStep1),
      this.loadTextFrame(this.tipPathStep2),
    ]).then(([step1, step2]) => {
      this.tipFrameStep1 = step1;
      this.tipFrameStep2 = step2;
      this.tipFramesReady = true;
      this.checkLevelGuide();
    }).catch((err: unknown) => {
      throw err instanceof Error ? err : new Error('Guide 文案资源加载失败');
    });
  }

  onDestroy(): void {
    GM.event.off('startLevel', this.onStartLevelHandler);
    GM.event.off('ringReleased', this.onRingReleasedHandler);
    GM.event.off('guideDialogClosed', this.onGuideDialogClosedHandler);
    input.off(Input.EventType.TOUCH_END, this.onMaskTouchEnd, this);
    this.resumeCountdown();
  }

  private checkLevelGuide(): void {
    const level = Number(GM?.data?.getState('currentLevel') ?? 1);
    if (level === 1) {
      this.pendingLevel1Guide = true;
      if (this.tipFramesReady) {
        this.startGuide();
        this.pendingLevel1Guide = false;
      }
    } else {
      this.pendingLevel1Guide = false;
      this.stopGuide();
    }

    if (level === this.firstBombLevel) {
      void this.openGuideDialog();
      return;
    }
    this.bombGuideDialogOpening = false;
    this.resumeCountdown();
  }

  private async openGuideDialog(): Promise<void> {
    if (this.bombGuideDialogOpening) return;
    this.bombGuideDialogOpening = true;
    this.pauseCountdown();
    const dialogNode = await GM.dialog.open({ path: this.guideDialogPath, parent: this.node });
    if (!dialogNode) {
      this.bombGuideDialogOpening = false;
      this.resumeCountdown();
      throw new Error(`[Guide] Failed to open dialog: ${this.guideDialogPath}`);
    }
  }

  private pauseCountdown(): void {
    if (this.countdownPausedByGuide) return;
    GM.event.emit('pauseGameCountdown');
    this.countdownPausedByGuide = true;
  }

  private resumeCountdown(): void {
    if (!this.countdownPausedByGuide) return;
    GM.event.emit('resumeGameCountdown');
    this.countdownPausedByGuide = false;
  }

  private setupGuideNodes(): void {
    this.maskLayer = this.getOrCreateChild('MaskLayer');
    this.spotlight = this.getOrCreateChild('Spotlight');
    this.gestureAnchor = this.getOrCreateChild('GestureAnchor');
    this.tip = this.getOrCreateChild('Tip');
    this.topMask = this.getOrCreateChildInParent(this.maskLayer, 'TopMask');
    this.bottomMask = this.getOrCreateChildInParent(this.maskLayer, 'BottomMask');
    this.leftMask = this.getOrCreateChildInParent(this.maskLayer, 'LeftMask');
    this.rightMask = this.getOrCreateChildInParent(this.maskLayer, 'RightMask');

    this.setupMaskLayer(this.maskLayer);
    this.setupSpotlight(this.spotlight);
    this.setupTip(this.tip);
  }

  private setupMaskLayer(node: Node): void {
    const tf = node.getComponent(UITransform) || node.addComponent(UITransform);
    const parentTf = this.node.getComponent(UITransform);
    if (!parentTf) {
      throw new Error('Guide 根节点缺少 UITransform');
    }
    tf.setContentSize(parentTf.width, parentTf.height);
    this.setupMaskSlice(this.topMask, parentTf.width, parentTf.height);
    this.setupMaskSlice(this.bottomMask, parentTf.width, parentTf.height);
    this.setupMaskSlice(this.leftMask, parentTf.width, parentTf.height);
    this.setupMaskSlice(this.rightMask, parentTf.width, parentTf.height);
    node.layer = Layers.Enum.UI_2D;
  }

  private setupMaskSlice(node: Node | null, width: number, height: number): void {
    if (!node) {
      throw new Error('Guide 遮罩切片节点缺失');
    }
    const tf = node.getComponent(UITransform) || node.addComponent(UITransform);
    tf.setContentSize(width, height);
    const g = node.getComponent(Graphics) || node.addComponent(Graphics);
    g.clear();
    g.fillColor = new Color(0, 0, 0, 180);
    g.rect(-width * 0.5, -height * 0.5, width, height);
    g.fill();
    node.getComponent(BlockInputEvents) || node.addComponent(BlockInputEvents);
    node.layer = Layers.Enum.UI_2D;
  }

  private setupSpotlight(node: Node): void {
    node.active = false;
    const tf = node.getComponent(UITransform) || node.addComponent(UITransform);
    tf.setContentSize(100, 60);
  }

  private setupTip(node: Node): void {
    const tf = node.getComponent(UITransform) || node.addComponent(UITransform);
    tf.setContentSize(360, 120);
    this.tipSprite = node.getComponent(Sprite) || node.addComponent(Sprite);
    this.tipSprite.color = new Color(255, 255, 255, 255);
  }

  private async loadTextFrame(path: string): Promise<SpriteFrame> {
    return await new Promise<SpriteFrame>((resolve, reject) => {
      resources.load(`${path}/spriteFrame`, SpriteFrame, (err, frame) => {
        if (err || !frame) {
          reject(new Error(`Guide 文案资源加载失败: ${path}`));
          return;
        }
        resolve(frame);
      });
    });
  }

  private startGuide(): void {
    const gameNode = this.getGameNode();
    this.progressNode = gameNode.getChildByName('LevelAndTimer')?.getChildByName('Progress') ?? null;
    if (!this.progressNode) {
      throw new Error('Guide 找不到目标节点: Game/LevelAndTimer/Progress');
    }
    this.step = 1;
    this.node.active = true;
    this.pauseCountdown();
    this.enterStep1();
  }

  private stopGuide(): void {
    this.step = 0;
    this.node.active = false;
    this.resumeCountdown();
    if (this.handNode && this.handNode.isValid) {
      this.handNode.destroy();
      this.handNode = null;
    }
  }

  private enterStep1(): void {
    if (!this.progressNode || !this.tipFrameStep1) {
      throw new Error('Guide Step1 初始化不完整');
    }
    this.focusNode(this.progressNode, this.tipFrameStep1, 'click-gesture');
  }

  private enterStep2(): void {
    const gameNode = this.getGameNode();
    const ringNode = gameNode.getChildByName('Area')?.getChildByName(this.ringId) ?? null;
    if (!ringNode) {
      throw new Error(`Guide 找不到目标锁环: ${this.ringId}`);
    }
    if (!this.tipFrameStep2) {
      throw new Error('Guide Step2 文案资源未就绪');
    }
    this.focusNode(ringNode, this.tipFrameStep2, 'ring-gesture');
  }

  private focusNode(target: Node, tipFrame: SpriteFrame, clipName: string): void {
    if (!this.spotlight || !this.gestureAnchor || !this.tip || !this.tipSprite) {
      throw new Error('Guide 节点初始化不完整');
    }
    const rect = this.getWorldRect(target);
    this.applyMaskHole(rect);
    this.placeSpotlight(rect);
    this.placeGesture(rect.center, rect.height, clipName);
    this.placeTip(rect.center, rect.height, tipFrame);
  }

  private getWorldRect(target: Node): { center: Vec3; width: number; height: number } {
    const tf = target.getComponent(UITransform);
    if (!tf) {
      throw new Error(`Guide 目标节点缺少 UITransform: ${target.name}`);
    }
    const worldRect = tf.getBoundingBoxToWorld();
    const width = worldRect.width;
    const height = worldRect.height;
    const center = this.getTargetWorldCenter(target, worldRect);
    return { center, width, height };
  }

  private getTargetWorldCenter(target: Node, worldRect: { x: number; y: number; width: number; height: number }): Vec3 {
    const ringComp = target.getComponent('Ring');
    if (!ringComp) {
      return new Vec3(worldRect.x + worldRect.width * 0.5, worldRect.y + worldRect.height * 0.5, 0);
    }
    const worldMatrix = new Mat4();
    target.getWorldMatrix(worldMatrix);
    const worldCenter = new Vec3();
    Vec3.transformMat4(worldCenter, this.ringInteractionCenterOffset, worldMatrix);
    return worldCenter;
  }

  private placeSpotlight(_rect: { center: Vec3; width: number; height: number }): void {
    if (!this.spotlight) throw new Error('Guide Spotlight 未初始化');
    this.spotlight.active = false;
  }

  private placeGesture(center: Vec3, _targetHeight: number, clipName: string): void {
    if (!this.gestureAnchor || !this.guideHandPrefab) {
      throw new Error('Guide 缺少 gestureAnchor 或 guideHandPrefab');
    }
    if (this.handNode && this.handNode.isValid) {
      this.handNode.destroy();
      this.handNode = null;
    }
    const local = this.toGuideLocal(center);
    this.gestureAnchor.setPosition(local.x, local.y, 0);
    const handNode = instantiate(this.guideHandPrefab);
    this.gestureAnchor.addChild(handNode);
    handNode.setPosition(0, 0, 0);
    const anim = handNode.getComponent(Animation);
    if (!anim) {
      throw new Error('GuideHand.prefab 缺少 Animation 组件');
    }
    anim.play(clipName);
    const state = anim.getState(clipName);
    if (!state) {
      throw new Error(`GuideHand 动画不存在: ${clipName}`);
    }
    state.repeatCount = Infinity;
    this.handNode = handNode;
  }

  private placeTip(center: Vec3, _targetHeight: number, frame: SpriteFrame): void {
    if (!this.tip || !this.tipSprite) throw new Error('Guide Tip 未初始化');
    const local = this.toGuideLocal(center);
    this.tip.setPosition(local.x, local.y + this.tipOffsetY, 0);
    this.tipSprite.spriteFrame = frame;
    const tf = this.tip.getComponent(UITransform);
    if (!tf) throw new Error('Guide Tip 缺少 UITransform');
    const rect = frame.rect;
    tf.setContentSize(rect.width, rect.height);
  }

  private toGuideLocal(worldPos: Vec3): Vec3 {
    const tf = this.node.getComponent(UITransform);
    if (!tf) {
      throw new Error('Guide 根节点缺少 UITransform');
    }
    const out = new Vec3();
    tf.convertToNodeSpaceAR(worldPos, out);
    return out;
  }

  private onMaskTouchEnd(event: EventTouch): void {
    if (this.step !== 1 || !this.progressNode || !this.node.active) return;
    const touch = event.getUILocation();
    const rect = this.getWorldRect(this.progressNode);
    const halfW = rect.width * 0.5;
    const halfH = rect.height * 0.5;
    const inX = touch.x >= rect.center.x - halfW && touch.x <= rect.center.x + halfW;
    const inY = touch.y >= rect.center.y - halfH && touch.y <= rect.center.y + halfH;
    if (!inX || !inY) return;
    this.step = 2;
    this.enterStep2();
  }

  private getOrCreateChild(name: string): Node {
    const existed = this.node.getChildByName(name);
    if (existed) return existed;
    const node = new Node(name);
    this.node.addChild(node);
    return node;
  }

  private getOrCreateChildInParent(parent: Node | null, name: string): Node {
    if (!parent) {
      throw new Error(`Guide 缺少父节点: ${name}`);
    }
    const existed = parent.getChildByName(name);
    if (existed) return existed;
    const node = new Node(name);
    parent.addChild(node);
    return node;
  }

  private getGameNode(): Node {
    if (this.node.parent?.name === 'Game') {
      return this.node.parent;
    }
    const underParent = this.node.parent?.getChildByName('Game');
    if (underParent) {
      return underParent;
    }
    const underScene = this.node.scene?.getChildByPath('Canvas/Game');
    if (underScene) {
      return underScene;
    }
    throw new Error('Guide 找不到 Game 节点');
  }

  private applyMaskHole(rect: { center: Vec3; width: number; height: number }): void {
    const rootTf = this.node.getComponent(UITransform);
    if (!rootTf) {
      throw new Error('Guide 根节点缺少 UITransform');
    }
    const local = this.toGuideLocal(rect.center);
    const halfW = rect.width * 0.5;
    const halfH = rect.height * 0.5;
    const minX = -rootTf.width * 0.5;
    const maxX = rootTf.width * 0.5;
    const minY = -rootTf.height * 0.5;
    const maxY = rootTf.height * 0.5;
    const holeLeft = local.x - halfW;
    const holeRight = local.x + halfW;
    const holeTop = local.y + halfH;
    const holeBottom = local.y - halfH;

    const topH = Math.max(0, maxY - holeTop);
    const bottomH = Math.max(0, holeBottom - minY);
    const leftW = Math.max(0, holeLeft - minX);
    const rightW = Math.max(0, maxX - holeRight);

    this.layoutMaskSlice(this.topMask, rootTf.width, topH, 0, holeTop + topH * 0.5);
    this.layoutMaskSlice(this.bottomMask, rootTf.width, bottomH, 0, minY + bottomH * 0.5);
    this.layoutMaskSlice(this.leftMask, leftW, rect.height, minX + leftW * 0.5, local.y);
    this.layoutMaskSlice(this.rightMask, rightW, rect.height, holeRight + rightW * 0.5, local.y);
  }

  private layoutMaskSlice(node: Node | null, width: number, height: number, x: number, y: number): void {
    if (!node) {
      throw new Error('Guide 遮罩切片节点缺失');
    }
    node.active = width > 0 && height > 0;
    if (!node.active) return;
    const tf = node.getComponent(UITransform) || node.addComponent(UITransform);
    tf.setContentSize(width, height);
    const g = node.getComponent(Graphics) || node.addComponent(Graphics);
    g.clear();
    g.fillColor = new Color(0, 0, 0, 180);
    g.rect(-width * 0.5, -height * 0.5, width, height);
    g.fill();
    node.setPosition(x, y, 0);
  }
}
