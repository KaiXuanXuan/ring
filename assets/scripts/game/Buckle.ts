import { _decorator, Component, Node, Sprite, Vec3 } from 'cc';
import type { BuckleConfig } from './Types';

const { ccclass } = _decorator;

@ccclass('Buckle')
export class Buckle extends Component {
  private static readonly RENDER_PRIORITY = 2000;
  private static readonly SLOT_LOCAL_POS: Record<string, Vec3> = {
    buckle1: new Vec3(-245, 0, 0),
    buckle2: new Vec3(-170, -170, 0),
    buckle3: new Vec3(0, -240, 0),
    buckle4: new Vec3(170, -170, 0),
    buckle5: new Vec3(245, 0, 0),
  };

  private cfg: BuckleConfig | null = null;
  private localPos: Vec3 = new Vec3();

  setup(cfg: BuckleConfig, ringScale: number): void {
    this.cfg = cfg;
    const lp = Buckle.SLOT_LOCAL_POS[cfg.id];
    if (!lp) {
      throw new Error(`未知 Buckle 槽位: ${cfg.id}`);
    }
    this.localPos = lp.clone();
    this.node.setScale(ringScale, ringScale, 1);
    this.node.name = `${cfg.ringId}-${cfg.id}`;
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

