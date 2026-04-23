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
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;
  private readonly onOpenTimeoutDialogHandler = this.onOpenTimeoutDialog.bind(this);
  private readonly onOpenWinDialogHandler = this.onOpenWinDialog.bind(this);
  private readonly onPauseTimerHandler = this.onPauseTimer.bind(this);
  private readonly onResumeTimerHandler = this.onResumeTimer.bind(this);
  private readonly onPauseGameCountdownHandler = this.onPauseTimer.bind(this);
  private readonly onResumeGameCountdownHandler = this.onResumeTimer.bind(this);
  private readonly onRestartLevelHandler = this.onRestartLevel.bind(this);

  onLoad(): void {
    // Register event listeners
    GM.event.on('openTimeoutDialog', this.onOpenTimeoutDialogHandler);
    GM.event.on('openWinDialog', this.onOpenWinDialogHandler);
    GM.event.on('pauseTimer', this.onPauseTimerHandler);
    GM.event.on('resumeTimer', this.onResumeTimerHandler);
    GM.event.on('pauseGameCountdown', this.onPauseGameCountdownHandler);
    GM.event.on('resumeGameCountdown', this.onResumeGameCountdownHandler);
    GM.event.on('restartLevel', this.onRestartLevelHandler);
  }

  onDestroy(): void {
    this.stopTimer();
    GM.event.off('openTimeoutDialog', this.onOpenTimeoutDialogHandler);
    GM.event.off('openWinDialog', this.onOpenWinDialogHandler);
    GM.event.off('pauseTimer', this.onPauseTimerHandler);
    GM.event.off('resumeTimer', this.onResumeTimerHandler);
    GM.event.off('pauseGameCountdown', this.onPauseGameCountdownHandler);
    GM.event.off('resumeGameCountdown', this.onResumeGameCountdownHandler);
    GM.event.off('restartLevel', this.onRestartLevelHandler);
  }

  /**
   * Initialize level display and start timer
   */
  initLevel(level: number): void {
    console.log('[Level] initLevel called with level:', level);
    console.log('[Level] timerLabel:', this.timerLabel);
    console.log('[Level] progressFill:', this.progressFill);
    console.log('[Level] levelLabel:', this.levelLabel);
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
      this.timerInterval = null;
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
    if (this.remainingTime <= 0) return;
    if (!this.timerInterval) {
      this.startTimer();
      return;
    }
    this.isRunning = true;
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
    console.log('[Level] startTimer called');
    this.stopTimer();
    this.isRunning = true;
    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;

      this.remainingTime--;
      console.log('[Level] Time remaining:', this.remainingTime);
      this.updateTimerDisplay();

      if (this.remainingTime <= 0) {
        this.stopTimer();
        GM.event.emit('timeout');
      }
    }, 1000);
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
        uiTransform.setContentSize(newWidth, 30);
      }
    }
  }
}