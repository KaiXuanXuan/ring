import { _decorator, Button, Component, Label, Node } from 'cc';

const { ccclass, property } = _decorator;

declare const GM: any;

type LevelCardState = 'locked' | 'unlocked' | 'cleared';

@ccclass('LevelCard')
export class LevelCard extends Component {
  @property
  level = 0;

  @property(Node)
  lockedNode: Node | null = null;

  @property(Node)
  unlockedNode: Node | null = null;

  @property(Node)
  clearedNode: Node | null = null;

  @property(Node)
  labelNode: Node | null = null;

  private button: Button | null = null;
  private label: Label | null = null;
  private readonly onUnlockedLevelChange = (): void => this.refresh();

  onLoad(): void {
    this.button = this.node.getComponent(Button);
    if (!this.button) {
      throw new Error('LevelCard 缺少 Button 组件');
    }

    this.lockedNode = this.lockedNode ?? this.node.getChildByName('Locked');
    this.unlockedNode = this.unlockedNode ?? this.node.getChildByName('Unlocked');
    this.labelNode = this.labelNode ?? this.node.getChildByName('Label');
    this.clearedNode = this.clearedNode ?? this.unlockedNode?.getChildByName('Cleared') ?? null;

    if (!this.lockedNode || !this.unlockedNode || !this.clearedNode || !this.labelNode) {
      throw new Error('LevelCard 节点结构不完整：需要 Locked/Unlocked/Unlocked/Cleared/Label');
    }

    this.label = this.labelNode.getComponent(Label);
    if (!this.label) {
      throw new Error('LevelCard 的 Label 节点缺少 Label 组件');
    }

    if (this.level <= 0) {
      const parsed = Number(this.label.string);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`LevelCard level 非法: ${this.label.string}`);
      }
      this.level = Math.floor(parsed);
    }

    this.button.node.on(Button.EventType.CLICK, this.onClick, this);
    GM.data.onChange('unlockedLevel', this.onUnlockedLevelChange);
    this.refresh();
  }

  onDestroy(): void {
    this.button?.node.off(Button.EventType.CLICK, this.onClick, this);
    GM.data.offChange('unlockedLevel', this.onUnlockedLevelChange);
  }

  setup(level: number): void {
    if (!Number.isFinite(level) || level <= 0) {
      throw new Error(`LevelCard.setup level 非法: ${level}`);
    }
    this.level = Math.floor(level);
    this.refresh();
  }

  refresh(): void {
    if (!this.lockedNode || !this.unlockedNode || !this.clearedNode || !this.label || !this.button) {
      throw new Error('LevelCard 尚未初始化完成');
    }
    this.label.string = String(this.level);
    const state = this.resolveState();
    this.applyState(state);
  }

  private onClick(): void {
    const state = this.resolveState();
    if (state === 'locked') {
      return;
    }
    GM.data.setState({ currentLevel: this.level });
    GM.event.emit('startLevel', { level: this.level });
  }

  private resolveState(): LevelCardState {
    const unlockedLevelRaw = Number(GM.data.getState('unlockedLevel'));
    if (!Number.isFinite(unlockedLevelRaw) || unlockedLevelRaw <= 0) {
      throw new Error(`unlockedLevel 非法: ${GM.data.getState('unlockedLevel')}`);
    }
    const unlockedLevel = Math.floor(unlockedLevelRaw);
    if (this.level > unlockedLevel) return 'locked';
    if (this.level === unlockedLevel) return 'unlocked';
    return 'cleared';
  }

  private applyState(state: LevelCardState): void {
    if (!this.lockedNode || !this.unlockedNode || !this.clearedNode || !this.button) {
      throw new Error('LevelCard 节点未绑定');
    }
    if (state === 'locked') {
      this.lockedNode.active = true;
      this.unlockedNode.active = false;
      this.clearedNode.active = false;
      this.button.interactable = false;
      return;
    }
    this.lockedNode.active = false;
    this.unlockedNode.active = true;
    this.clearedNode.active = state === 'cleared';
    this.button.interactable = true;
  }
}
