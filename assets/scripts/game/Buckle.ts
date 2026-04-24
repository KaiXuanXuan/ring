import { _decorator, Component, Node, Sprite, Vec3 } from 'cc';
import type { BuckleConfig } from './Types';

const { ccclass } = _decorator;

@ccclass('Buckle')
export class Buckle extends Component {
  private static readonly RENDER_PRIORITY = 2000;
  private static readonly LOCAL_RADIUS = 245;
  private static readonly MIN_ANGLE = -135;
  private static readonly MAX_ANGLE = 135;

  private cfg: BuckleConfig | null = null;
  private localPos: Vec3 = new Vec3();

  setup(cfg: BuckleConfig, ringScale: number, index: number): void {
    this.cfg = cfg;
    if (!Number.isFinite(cfg.angle)) {
      throw new Error(`Buckle angle 非法: ${cfg.angle}`);
    }
    if (cfg.angle < Buckle.MIN_ANGLE || cfg.angle > Buckle.MAX_ANGLE) {
      throw new Error(`Buckle angle 超出范围(${Buckle.MIN_ANGLE}~${Buckle.MAX_ANGLE}): ${cfg.angle}`);
    }
    const angleRad = ((cfg.angle - 90) * Math.PI) / 180;
    this.localPos = new Vec3(
      Math.cos(angleRad) * Buckle.LOCAL_RADIUS,
      Math.sin(angleRad) * Buckle.LOCAL_RADIUS,
      0
    );
    this.node.setScale(ringScale, ringScale, 1);
    this.node.name = `${cfg.ringId}-buckle-${index}`;
    this.raisePriority();
  }

  syncWithRing(center: Vec3, ringAngle: number, ringScale: number): void {
    if (!this.cfg) {
      throw new Error('Buckle 组件未 setup');
    }
    const angleRad = (ringAngle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const x = this.localPos.x * ringScale;
    const y = this.localPos.y * ringScale;
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    this.node.setPosition(center.x + rx, center.y + ry, 0);
    this.node.setRotationFromEuler(0, 0, ringAngle + this.cfg.angle);
  }

  private raisePriority(): void {
    const sprites = this.getComponentsInChildren(Sprite);
    for (const sp of sprites) {
      sp.priority = Buckle.RENDER_PRIORITY;
    }
  }
}

