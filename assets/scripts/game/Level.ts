/**
 * Level Manager Component
 *
 * Manages level display and countdown timer functionality.
 * Handles UI updates for timer progress and remaining time.
 */

import { _decorator, Component, Node, Label, Sprite, UITransform } from 'cc';

const { ccclass, property } = _decorator;

// GM is attached to window after initialization
declare const GM: any;

@ccclass('Level')
export class Level extends Component {
  @property(Node)
  levelLabel: Node | null = null; // Level label node

  @property(Node)
  progressFill: Node | null = null; // Progress fill node

  @property(Node)
  timerLabel: Node | null = null; // Timer label node

  private currentLevel: number = 1;
  private totalTime: number = 120; // Total time per level in seconds
  private remainingTime: number = 120;
  private timerInterval: number = 0;
  private isRunning: boolean = false;

  onLoad(): void {
    // Register event listeners
    this.onOpenTimeoutDialog = this.onOpenTimeoutDialog.bind(this);
    this.onOpenWinDialog = this.onOpenWinDialog.bind(this);
    this.onPauseTimer = this.onPauseTimer.bind(this);
    this.onResumeTimer = this.onResumeTimer.bind(this);
    this.onRestartLevel = this.onRestartLevel.bind(this);

    GM.event.on('openTimeoutDialog', this.onOpenTimeoutDialog);
    GM.event.on('openWinDialog', this.onOpenWinDialog);
    GM.event.on('pauseTimer', this.onPauseTimer);
    GM.event.on('resumeTimer', this.onResumeTimer);
    GM.event.on('restartLevel', this.onRestartLevel);
  }

  onDestroy(): void {
    this.stopTimer();
    GM.event.off('openTimeoutDialog', this.onOpenTimeoutDialog);
    GM.event.off('openWinDialog', this.onOpenWinDialog);
    GM.event.off('pauseTimer', this.onPauseTimer);
    GM.event.off('resumeTimer', this.onResumeTimer);
    GM.event.off('restartLevel', this.onRestartLevel);
  }

  /**
   * Initialize level display and start timer
   */
  initLevel(level: number): void {
    this.currentLevel = level;
    this.remainingTime = this.totalTime;
    this.isRunning = true;

    this.updateLevelDisplay();
    this.updateTimerDisplay();
    this.startTimer();
  }

  /**
   * Stop and reset timer
   */
  stopTimer(): void {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = 0;
    }
  }

  /**
   * Pause timer
   */
  private onPauseTimer(): void {
    this.isRunning = false;
  }

  /**
   * Resume timer
   */
  private onResumeTimer(): void {
    if (this.remainingTime > 0 && this.remainingTime < this.totalTime) {
      this.isRunning = true;
    }
  }

  /**
   * Restart current level
   */
  private onRestartLevel(): void {
    this.initLevel(this.currentLevel);
  }

  /**
   * Add time to remaining time
   */
  addTime(seconds: number): void {
    this.remainingTime = Math.min(this.remainingTime + seconds, this.totalTime);
    this.updateTimerDisplay();
  }

  /**
   * Handle timeout dialog open
   */
  private onOpenTimeoutDialog(): void {
    this.stopTimer();
  }

  /**
   * Handle win dialog open
   */
  private onOpenWinDialog(): void {
    this.stopTimer();
  }

  /**
   * Start countdown timer
   */
  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;

      this.remainingTime--;
      this.updateTimerDisplay();

      if (this.remainingTime <= 0) {
        this.stopTimer();
        GM.event.emit('timeout');
      }
    }, 1000) as unknown as number;
  }

  /**
   * Update level label display
   */
  private updateLevelDisplay(): void {
    if (!this.levelLabel) return;
    const label = this.levelLabel.getComponent(Label);
    if (label) {
      label.string = `Level ${this.currentLevel}`;
    }
  }

  /**
   * Update timer display (progress bar and label)
   */
  private updateTimerDisplay(): void {
    // Update timer label
    if (this.timerLabel) {
      const label = this.timerLabel.getComponent(Label);
      if (label) {
        label.string = `${this.remainingTime}`;
      }
    }

    // Update progress bar
    if (this.progressFill) {
      const uiTransform = this.progressFill.getComponent(UITransform);
      const progress = this.remainingTime / this.totalTime;
      if (uiTransform) {
        // Progress bar goes from 100% to 0% as time decreases
        // The Fill starts at position -200 and has width 400
        // We'll adjust the width based on progress
        const maxWidth = 400;
        const newWidth = maxWidth * progress;
        uiTransform.setContentSize(newWidth, 35);
      }
    }
  }
}