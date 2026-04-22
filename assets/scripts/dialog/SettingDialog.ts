/**
 * Setting Dialog Component
 *
 * Displayed when player clicks pause button.
 * Has Back (to level selection), Replay (restart level), and Continue (resume game) buttons.
 * Also has BGM and SFX toggle switches.
 */

import { _decorator, Component, Node, Button, tween, Vec3, UITransform } from 'cc';

const { ccclass, property } = _decorator;

// GM is attached to window after initialization
declare const GM: any;

@ccclass('SettingDialog')
export class SettingDialog extends Component {
  // BGM Switch node (will auto-find children)
  @property(Node)
  bgmSwitch: Node | null = null; // BGM/Switch node

  // SFX Switch node (will auto-find children)
  @property(Node)
  sfxSwitch: Node | null = null; // SFX/Switch node

  // Button nodes
  @property(Node)
  backBtn: Node | null = null; // Back button node

  @property(Node)
  replayBtn: Node | null = null; // Replay button node

  @property(Node)
  continueBtn: Node | null = null; // Continue button node

  // Switch positions
  private readonly SWITCH_ON_POS = 40;
  private readonly SWITCH_OFF_POS = -40;
  private readonly ANIMATION_DURATION = 0.2;

  // Event handlers
  private onBackClick(): void {
    GM.event.emit('backToLevelSelection');
    this.closeDialog();
  }

  private onReplayClick(): void {
    GM.event.emit('restartLevel');
    this.closeDialog();
  }

  private onContinueClick(): void {
    GM.event.emit('resumeGame');
    this.closeDialog();
  }

  private onBgmSwitchClick(): void {
    const currentBgm = GM.data.getState('bgm') ?? true;
    GM.data.setState({ bgm: !currentBgm });
    this.updateBgmSwitch();
    this.updateBgmVolume(!currentBgm);
  }

  private onSfxSwitchClick(): void {
    const currentSfx = GM.data.getState('sfx') ?? true;
    GM.data.setState({ sfx: !currentSfx });
    this.updateSfxSwitch();
    this.updateSfxVolume(!currentSfx);
  }

  onLoad(): void {
    // Setup buttons
    this.setupButton(this.backBtn, this.onBackClick.bind(this));
    this.setupButton(this.replayBtn, this.onReplayClick.bind(this));
    this.setupButton(this.continueBtn, this.onContinueClick.bind(this));
    this.setupButton(this.bgmSwitch, this.onBgmSwitchClick.bind(this));
    this.setupButton(this.sfxSwitch, this.onSfxSwitchClick.bind(this));

    // Pause game when dialog opens
    GM.event.emit('pauseGame');
  }

  start(): void {
    // Initialize switch states from GM.data
    this.updateBgmSwitch();
    this.updateSfxSwitch();
  }

  onDestroy(): void {
    // Cleanup event listeners if any
  }

  /**
   * Update BGM switch UI based on current state
   */
  private updateBgmSwitch(): void {
    if (!this.bgmSwitch) return;
    const isBgmOn = GM.data.getState('bgm') ?? true;
    const offNode = this.bgmSwitch.getChildByName('Off');
    const onNode = this.bgmSwitch.getChildByName('On');
    const pointNode = this.bgmSwitch.getChildByName('Button');
    this.updateSwitchUI(offNode, onNode, pointNode, isBgmOn);
  }

  /**
   * Update SFX switch UI based on current state
   */
  private updateSfxSwitch(): void {
    if (!this.sfxSwitch) return;
    const isSfxOn = GM.data.getState('sfx') ?? true;
    const offNode = this.sfxSwitch.getChildByName('Off');
    const onNode = this.sfxSwitch.getChildByName('On');
    const pointNode = this.sfxSwitch.getChildByName('Button');
    this.updateSwitchUI(offNode, onNode, pointNode, isSfxOn);
  }

  /**
   * Update switch UI with animation
   * @param offNode - Off state node
   * @param onNode - On state node
   * @param pointNode - Point/Button node to animate
   * @param isOn - Whether switch is in On state
   */
  private updateSwitchUI(
    offNode: Node | null,
    onNode: Node | null,
    pointNode: Node | null,
    isOn: boolean
  ): void {
    if (!offNode || !onNode || !pointNode) return;

    // Show/hide Off and On nodes
    offNode.active = !isOn;
    onNode.active = isOn;

    // Animate point node position
    const targetX = isOn ? this.SWITCH_ON_POS : this.SWITCH_OFF_POS;

    // Stop any existing animation
    tween(pointNode).stop();

    // Animate to new position
    tween(pointNode)
      .to(this.ANIMATION_DURATION, { position: new Vec3(targetX, 0, 0) })
      .start();
  }

  /**
   * Update BGM volume based on state
   * @param isOn - Whether BGM should be on
   */
  private updateBgmVolume(isOn: boolean): void {
    GM.audio.setBgmVolume(isOn ? 1 : 0);
  }

  /**
   * Update SFX volume based on state
   * @param isOn - Whether SFX should be on
   */
  private updateSfxVolume(isOn: boolean): void {
    GM.audio.setSfxVolume(isOn ? 1 : 0);
  }

  /**
   * Close this dialog
   */
  private closeDialog(): void {
    GM.dialog.close(this.node);
  }

  /**
   * Setup button click handler
   * @param btnNode - Button node
   * @param handler - Click handler function
   */
  private setupButton(btnNode: Node | null, handler: () => void): void {
    if (!btnNode) return;
    const button = btnNode.getComponent(Button);
    if (button) {
      button.node.on(Button.EventType.CLICK, handler);
    }
  }
}