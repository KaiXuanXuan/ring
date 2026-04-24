/**
 * Main Scene Controller
 *
 * Handles UI routing and lifecycle driven by GM events.
 * Manages LevelSelection and Game panel visibility.
 */

import { _decorator, Component, Node } from 'cc';
import { getLevelConfig } from '../config/LevelConfig';
import { Runtime } from '../game/Runtime';
import { Level } from '../game/Level';
import { AdService } from '../service/AdService';

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
  private readonly onShowLevelSelectionHandler = this.showLevelSelection.bind(this);
  private readonly onStartLevelHandler = this.startLevel.bind(this);
  private readonly onBackToLevelSelectionHandler = this.showLevelSelection.bind(this);
  private readonly onHintHandler = this.onHint.bind(this);
  private readonly onTimeoutHandler = this.onTimeout.bind(this);
  private readonly onLevelCompleteHandler = this.onLevelComplete.bind(this);
  private readonly onOpenFailDialogHandler = this.onOpenFailDialog.bind(this);
  private readonly onAddTimeHandler = this.onAddTime.bind(this);

  onLoad(): void {
    AdService.showSplash();

    // Register GM event listeners
    GM.event.on('showLevelSelection', this.onShowLevelSelectionHandler);
    GM.event.on('startLevel', this.onStartLevelHandler);
    GM.event.on('hint', this.onHintHandler);
    GM.event.on('backToLevelSelection', this.onBackToLevelSelectionHandler);
    GM.event.on('timeout', this.onTimeoutHandler);
    GM.event.on('levelComplete', this.onLevelCompleteHandler);
    GM.event.on('openFailDialog', this.onOpenFailDialogHandler);
    GM.event.on('addTime', this.onAddTimeHandler);

    // Default entry: start game view directly
    const storedLevel = Number(window.GM?.data?.getState('currentLevel') ?? 1);
    this.currentLevel = Number.isFinite(storedLevel) && storedLevel > 0 ? storedLevel : 1;
    GM.event.emit('startLevel', { level: this.currentLevel });
  }

  onDestroy(): void {
    // Cleanup event listeners
    GM.event.off('showLevelSelection', this.onShowLevelSelectionHandler);
    GM.event.off('startLevel', this.onStartLevelHandler);
    GM.event.off('hint', this.onHintHandler);
    GM.event.off('backToLevelSelection', this.onBackToLevelSelectionHandler);
    GM.event.off('timeout', this.onTimeoutHandler);
    GM.event.off('levelComplete', this.onLevelCompleteHandler);
    GM.event.off('openFailDialog', this.onOpenFailDialogHandler);
    GM.event.off('addTime', this.onAddTimeHandler);
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
   * Apply gameplay hint.
   */
  private onHint(): void {
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
  private async onTimeout(): Promise<void> {
    await this.openDialog('prefab/TimeoutDialog');
    GM.event.emit('openTimeoutDialog');
  }

  /**
   * Handle level complete event - open WinDialog
   */
  private async onLevelComplete(): Promise<void> {
    this.level?.stopTimer();
    const unlockedRaw = Number(window.GM?.data?.getState('unlockedLevel') ?? 1);
    const unlockedLevel = Number.isFinite(unlockedRaw) && unlockedRaw > 0 ? Math.floor(unlockedRaw) : 1;
    const nextUnlockedLevel = Math.max(unlockedLevel, this.currentLevel + 1);
    window.GM?.data?.setState({ unlockedLevel: nextUnlockedLevel });
    AdService.reportLvFinish(this.currentLevel);
    AdService.showInterstitial(async () => {
      await this.openDialog('prefab/WinDialog');
      GM.event.emit('openWinDialog', { level: this.currentLevel, nextLevel: this.currentLevel + 1 });
    });
  }

  /**
   * Handle open fail dialog event
   */
  private async onOpenFailDialog(): Promise<void> {
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