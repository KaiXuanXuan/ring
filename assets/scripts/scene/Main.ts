/**
 * Main Scene Controller
 *
 * Handles UI routing and lifecycle driven by GM events.
 * Manages LevelSelection and Game panel visibility.
 */

import { _decorator, Component, Node } from 'cc';
import { Repo } from '../game/Repo';
import { Runtime } from '../game/Runtime';
import { Level } from '../game/Level';

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
  private readonly onShowLevelSelection = this.showLevelSelection.bind(this);
  private readonly onStartLevel = this.startLevel.bind(this);
  private readonly onPauseGame = this.pauseGame.bind(this);
  private readonly onResumeGame = this.resumeGame.bind(this);
  private readonly onBackToLevelSelection = this.showLevelSelection.bind(this);
  private readonly onTimeout = this.onTimeout.bind(this);
  private readonly onLevelComplete = this.onLevelComplete.bind(this);
  private readonly onOpenFailDialog = this.onOpenFailDialog.bind(this);
  private readonly onAddTime = this.onAddTime.bind(this);

  onLoad(): void {
    // Initialize level repository
    Repo.init();

    // Register GM event listeners
    GM.event.on('showLevelSelection', this.onShowLevelSelection);
    GM.event.on('startLevel', this.onStartLevel);
    GM.event.on('pauseGame', this.onPauseGame);
    GM.event.on('resumeGame', this.onResumeGame);
    GM.event.on('backToLevelSelection', this.onBackToLevelSelection);
    GM.event.on('timeout', this.onTimeout);
    GM.event.on('levelComplete', this.onLevelComplete);
    GM.event.on('openFailDialog', this.onOpenFailDialog);
    GM.event.on('addTime', this.onAddTime);

    // Default entry: start game view directly
    const storedLevel = Number(window.GM?.data?.getState<number>('currentLevel') ?? 1);
    this.currentLevel = Number.isFinite(storedLevel) && storedLevel > 0 ? storedLevel : 1;
    this.startLevel({ level: this.currentLevel });
  }

  onDestroy(): void {
    // Cleanup event listeners
    GM.event.off('showLevelSelection', this.onShowLevelSelection);
    GM.event.off('startLevel', this.onStartLevel);
    GM.event.off('pauseGame', this.onPauseGame);
    GM.event.off('resumeGame', this.onResumeGame);
    GM.event.off('backToLevelSelection', this.onBackToLevelSelection);
    GM.event.off('timeout', this.onTimeout);
    GM.event.off('levelComplete', this.onLevelComplete);
    GM.event.off('openFailDialog', this.onOpenFailDialog);
    GM.event.off('addTime', this.onAddTime);
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
      this.runtime.loadLevel(level, this.areaNode);
    }
  }

  /**
   * Pause the game
   */
  private pauseGame(): void {
    // Pause game logic
    // This can be implemented later based on game state management needs
  }

  /**
   * Resume the game
   */
  private resumeGame(): void {
    // Resume game logic
    // This can be implemented later based on game state management needs
  }

  /**
   * Update level label display
   */
  private updateLevelDisplay(level: number): void {
    if (!this.levelLabel) return;

    try {
      Repo.get(level);
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
  private onTimeout(): void {
    GM.event.emit('openTimeoutDialog');
    this.openDialog('resources/prefab/TimeoutDialog');
  }

  /**
   * Handle level complete event - open WinDialog
   */
  private onLevelComplete(): void {
    GM.event.emit('openWinDialog', { level: this.currentLevel, nextLevel: this.currentLevel + 1 });
    this.openDialog('resources/prefab/WinDialog');
  }

  /**
   * Handle open fail dialog event
   */
  private onOpenFailDialog(): void {
    this.openDialog('resources/prefab/FailDialog');
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
  private openDialog(path: string): void {
    GM.prefab.instantiate(path, (node: Node) => {
      if (node) {
        GM.dialog.open(node);
      }
    });
  }
}