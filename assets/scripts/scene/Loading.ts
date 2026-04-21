import { _decorator, Component, Node, UITransform, Widget } from 'cc';
import { initGM } from '../gm';
const { ccclass, property } = _decorator;

@ccclass('Loading')
export class Loading extends Component {
    @property(Node)
    private fillNode: Node | null = null;

    private fillMaxWidth: number = 0;

    start() {
        this.initFillNode();
        this.initGame();
    }

    private initFillNode(): void {
        if (!this.fillNode) {
            this.fillNode = this.node.getChildByPath('Progress/Fill');
        }
        const widget = this.fillNode?.getComponent(Widget);
        if (widget) {
            widget.isAlignLeft = true;
            widget.updateAlignment();
        }
        const transform = this.fillNode?.getComponent(UITransform);
        this.fillMaxWidth = transform?.width ?? 0;
    }

    /** 初始化游戏 */
    private async initGame(): Promise<void> {
        this.updateProgress(0);

        initGM({
            data: {
                defaults: {
                    currentLevel: 1, // 当前游玩关卡
                    unlockedLevel: 1, // 已解锁关卡，最大已通关+1 = 已解锁 = 最小未解锁-1
                    bgm: true,
                    sfx: true,
                }
            },
            scene: {
                loadingScene: 'Loading',
                mainScene: 'Main',
            },
            audio: {},
        });

        await window.GM.scene.loadMain((progress) => {
            this.updateProgress(progress);
        });
        this.updateProgress(1);
        this.scheduleOnce(() => {
            window.GM.scene.switchToMain();
        }, 0.1);
    }

    /** 更新进度显示 */
    private updateProgress(value: number): void {
        const progress = Math.min(1, Math.max(0, value));
        const transform = this.fillNode?.getComponent(UITransform);
        if (transform) {
            transform.width = this.fillMaxWidth * progress;
        }
    }
}
