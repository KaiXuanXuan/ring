import { _decorator, Component, Label } from 'cc';
import { Runtime } from './Runtime';

const { ccclass, property } = _decorator;
declare const GM: any;

@ccclass('Bomb')
export class Bomb extends Component {
  @property(Label)
  countdownLabel: Label | null = null;

  private runtime: Runtime | null = null;
  private bombId: string = '';
  private remainingSeconds: number = 0;
  private ticking = false;
  private isPaused = false;
  private readonly onPauseGameCountdownHandler = this.onPauseGameCountdown.bind(this);
  private readonly onResumeGameCountdownHandler = this.onResumeGameCountdown.bind(this);

  onLoad(): void {
    GM.event.on('pauseGameCountdown', this.onPauseGameCountdownHandler);
    GM.event.on('resumeGameCountdown', this.onResumeGameCountdownHandler);
  }

  setup(runtime: Runtime, bombId: string, timeoutSec: number): void {
    if (!this.countdownLabel) {
      throw new Error('Bomb 缺少 countdownLabel 绑定');
    }
    if (!Number.isFinite(timeoutSec) || timeoutSec <= 0) {
      throw new Error(`Bomb 倒计时非法: ${timeoutSec}`);
    }
    this.unschedule(this.tick);
    this.runtime = runtime;
    this.bombId = bombId;
    this.remainingSeconds = Math.ceil(timeoutSec);
    this.ticking = true;
    this.isPaused = false;
    this.updateLabel();
    this.schedule(this.tick, 1);
  }

  onDestroy(): void {
    GM.event.off('pauseGameCountdown', this.onPauseGameCountdownHandler);
    GM.event.off('resumeGameCountdown', this.onResumeGameCountdownHandler);
    this.unschedule(this.tick);
    this.ticking = false;
  }

  private tick = (): void => {
    if (!this.ticking) return;
    if (this.isPaused) return;
    this.remainingSeconds -= 1;
    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = 0;
      this.updateLabel();
      this.ticking = false;
      this.unschedule(this.tick);
      if (!this.runtime) {
        throw new Error('Bomb 超时时 runtime 丢失');
      }
      this.runtime.handleBombTimeout(this.bombId);
      return;
    }
    this.updateLabel();
  };

  private updateLabel(): void {
    if (!this.countdownLabel) {
      throw new Error('Bomb 缺少 countdownLabel 绑定');
    }
    this.countdownLabel.string = String(this.remainingSeconds);
  }

  private onPauseGameCountdown(): void {
    this.isPaused = true;
  }

  private onResumeGameCountdown(): void {
    this.isPaused = false;
  }
}
