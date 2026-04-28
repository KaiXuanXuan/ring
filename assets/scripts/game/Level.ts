/**
 * Level Manager Component
 *
 * Manages level display and countdown timer functionality.
 * Handles UI updates for timer progress and remaining time.
 */

import { _decorator, Component, Node, Label, Sprite, UITransform } from 'cc';
import { getLevelConfig } from '../config/LevelConfig';

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
  private totalTime: number = 0; // Total time per level in seconds
  private remainingTime: number = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;
  private readonly onPauseGameHandler = this.onPauseTimer.bind(this);
  private readonly onResumeGameHandler = this.onResumeTimer.bind(this);
  private readonly onRestartLevelHandler = this.onRestartLevel.bind(this);

  onLoad(): void {
    // Register event listeners
    GM.event.on('pauseGame', this.onPauseGameHandler);
    GM.event.on('resumeGame', this.onResumeGameHandler);
    GM.event.on('restartLevel', this.onRestartLevelHandler);
  }

  onDestroy(): void {
    this.stopTimer();
    GM.event.off('pauseGame', this.onPauseGameHandler);
    GM.event.off('resumeGame', this.onResumeGameHandler);
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
    const config = getLevelConfig(level);
    this.totalTime = config.totalTimeSeconds;
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
        GM.event.emit('openTimeoutDialog');
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
      const config = getLevelConfig(this.currentLevel);
      label.string = config.name;
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