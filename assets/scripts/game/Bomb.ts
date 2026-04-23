import { _decorator, Component, Label } from 'cc';
import { Runtime } from './Runtime';

const { ccclass, property } = _decorator;

@ccclass('Bomb')
export class Bomb extends Component {
  @property(Label)
  countdownLabel: Label | null = null;

  private runtime: Runtime | null = null;
  private bombId: string = '';
  private remainingSeconds: number = 0;
  private ticking = false;

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
    this.updateLabel();
    this.schedule(this.tick, 1);
  }

  onDestroy(): void {
    this.unschedule(this.tick);
    this.ticking = false;
  }

  private tick = (): void => {
    if (!this.ticking) return;
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
}
