/**
 * Main Scene Controller
 *
 * Handles UI routing and lifecycle driven by GM events.
 * Manages LevelSelection and Game panel visibility.
 */

import { _decorator, Component, Node } from 'cc';
import { getLevelConfig, MAX_LEVEL } from '../config/LevelConfig';
import { Runtime } from '../game/Runtime';
import { Level } from '../game/Level';
import { AdService } from '../service/AdService';
import { playBGM, playSFX } from '../utils/AudioManager';

const { ccclass, property } = _decorator;

// GM is attached to window after initialization
declare const GM: any;

/**
 * Main - Scene entry point
 * Routes between LevelSelection and Game panels based on GM events
 */
@ccclass('Main')
export class Main extends Component {
  @property(Node)
  levelSelectionPanel: Node | null = null;

  @property(Node)
  gamePanel: Node | null = null;

  @property(Node)
  areaNode: Node | null = null;

  @property(Node)
  levelLabel: Node | null = null;

  @property(Runtime)
  runtime: Runtime | null = null;

  @property(Level)
  level: Level | null = null;

  private currentLevel: number = 1;
  private skipHintAdOnce = false;
  private readonly onShowLevelSelectionHandler = this.showLevelSelection.bind(this);
  private readonly onStartLevelHandler = this.startLevel.bind(this);
  private readonly onBackToLevelSelectionHandler = this.showLevelSelection.bind(this);
  private readonly onOpenTimeoutDialogHandler = this.onOpenTimeoutDialog.bind(this);
  private readonly onOpenWinDialogHandler = this.onOpenWinDialog.bind(this);
  private readonly onOpenFailDialogHandler = this.onOpenFailDialog.bind(this);
  private readonly onAddTimeHandler = this.onAddTime.bind(this);
  private readonly onHintGuideSkipNextAdHandler = () => {
    this.skipHintAdOnce = true;
  };

  onLoad(): void {
    AdService.showSplash();

    // Register GM event listeners
    GM.event.on('showLevelSelection', this.onShowLevelSelectionHandler);
    GM.event.on('startLevel', this.onStartLevelHandler);
    GM.event.on('backToLevelSelection', this.onBackToLevelSelectionHandler);
    GM.event.on('openTimeoutDialog', this.onOpenTimeoutDialogHandler);
    GM.event.on('openWinDialog', this.onOpenWinDialogHandler);
    GM.event.on('openFailDialog', this.onOpenFailDialogHandler);
    GM.event.on('addTime', this.onAddTimeHandler);
    GM.event.on('hintGuideSkipNextAd', this.onHintGuideSkipNextAdHandler);

    // Play BGM when game starts
    playBGM('bgm');

    // Default entry: start game view directly
    const storedLevel = Number(window.GM?.data?.getState('currentLevel') ?? 1);
    this.currentLevel = Number.isFinite(storedLevel) && storedLevel > 0 ? storedLevel : 1;
    GM.event.emit('startLevel', { level: this.currentLevel });
  }

  onDestroy(): void {
    // Cleanup event listeners
    GM.event.off('showLevelSelection', this.onShowLevelSelectionHandler);
    GM.event.off('startLevel', this.onStartLevelHandler);
    GM.event.off('backToLevelSelection', this.onBackToLevelSelectionHandler);
    GM.event.off('openTimeoutDialog', this.onOpenTimeoutDialogHandler);
    GM.event.off('openWinDialog', this.onOpenWinDialogHandler);
    GM.event.off('openFailDialog', this.onOpenFailDialogHandler);
    GM.event.off('addTime', this.onAddTimeHandler);
    GM.event.off('hintGuideSkipNextAd', this.onHintGuideSkipNextAdHandler);
  }

  /**
   * Show level selection panel
   */
  private showLevelSelection(): void {
    this.setPanelVisible(this.levelSelectionPanel, true);
    this.setPanelVisible(this.gamePanel, false);

    // Clear any running game
    if (this.runtime) {
      this.runtime.clear();
    }
  }

  /**
   * Start a level
   * @param data - Level data { level: number }
   */
  private startLevel(data: { level?: number }): void {
    const level = data?.level ?? this.currentLevel;
    this.currentLevel = level;
    GM.data.setState({ currentLevel: level });
    AdService.reportLvStart(level);

    // Switch to game panel
    this.setPanelVisible(this.levelSelectionPanel, false);
    this.setPanelVisible(this.gamePanel, true);

    // Update level display
    this.updateLevelDisplay(level);

    // Initialize Level component (timer)
    if (this.level) {
      this.level.initLevel(level);
    }

    // Load and start the level
    if (this.runtime && this.areaNode) {
      this.runtime.clear();
      this.runtime.loadLevel(level, this.areaNode);
    }
  }

  /**
   * Pause button entry: pause game and open setting dialog
   */
  private async openSettingDialog(): Promise<void> {
    GM.event.emit('pauseGame');
    await this.openDialog('prefab/SettingDialog');
  }
  
  /**
   * Click hint icon.
   */
  private hint(): void {
    if (this.runtime?.isReleaseAnimating()) {
      return;
    }
    GM.event.emit('hint');
    if (this.skipHintAdOnce) {
      this.skipHintAdOnce = false;
      this.runtime?.applyHintRelease();
      return;
    }
    AdService.showInterstitial(() => {
      this.runtime?.applyHintRelease();
    });
  }

  /**
   * Update level label display
   */
  private updateLevelDisplay(level: number): void {
    if (!this.levelLabel) return;

    try {
      getLevelConfig(level);
      const label = this.levelLabel.getComponent('cc.Label') as any;
      if (label) {
        label.string = `level: ${level}`;
      }
    } catch (e) {
      console.warn('Failed to update level display:', e);
    }
  }

  /**
   * Helper to set panel visibility
   */
  private setPanelVisible(panel: Node | null, visible: boolean): void {
    if (panel) {
      panel.active = visible;
    }
  }

  /**
   * Handle timeout event - open TimeoutDialog
   */
  private async onOpenTimeoutDialog(): Promise<void> {
    GM.event.emit('pauseGame');
    await this.openDialog('prefab/TimeoutDialog');
  }

  /**
   * Handle level complete event - open WinDialog
   */
  private async onOpenWinDialog(): Promise<void> {
    GM.event.emit('pauseGame');
    const unlockedLevel = Number(window.GM?.data?.getState('unlockedLevel') ?? 1);
    const nextLevel = this.currentLevel + 1;
    const nextEffectiveLevel = Math.min(nextLevel, MAX_LEVEL);
    const nextUnlockedLevel = Math.max(unlockedLevel, nextLevel);
    window.GM?.data?.setState({ unlockedLevel: nextUnlockedLevel });
    AdService.reportLvFinish(this.currentLevel);
    // Play win SFX
    playSFX('win');
    AdService.showInterstitial(async () => {
      await this.openDialog('prefab/WinDialog');
      GM.event.emit('updateLevelLabel', { level: this.currentLevel, nextLevel: nextEffectiveLevel });
    });
  }

  /**
   * Handle open fail dialog event
   */
  private async onOpenFailDialog(): Promise<void> {
    GM.event.emit('pauseGame');
    // Play fail SFX
    playSFX('fail');
    await this.openDialog('prefab/FailDialog');
  }

  /**
   * Handle add time event
   */
  private onAddTime(data: { seconds: number }): void {
    if (this.level) {
      this.level.addTime(data.seconds);
    }
  }

  /**
   * Open a dialog prefab
   */
  private async openDialog(path: string): Promise<void> {
    const dialogNode = await GM.dialog.open({ path });
    if (!dialogNode) {
      throw new Error(`[Main] Failed to open dialog: ${path}`);
    }
  }
}