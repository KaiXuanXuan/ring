import { _decorator, Button, Color, Component, Node, Sprite, tween } from 'cc';
import { playSFX } from './AudioManager';

const { ccclass, requireComponent } = _decorator;
const BUTTON_PRESS_ANIM_DURATION = 0.1;
const BUTTON_PRESS_SCALE = 0.9;
const BUTTON_ENABLED_TINT = Color.WHITE.clone();
const BUTTON_PRESS_COLOR = new Color(204, 204, 204, 255);

@ccclass('ButtonPress')
@requireComponent(Button)
export class ButtonPress extends Component {

    private _duration: number = BUTTON_PRESS_ANIM_DURATION;
    private _tween: any = null;
    private _sprites: Sprite[] = [];
    private _button: Button | null = null;

    onLoad() {
        this._button = this.getComponent(Button);
        if (!this._button) {
            throw new Error('ButtonPress 依赖 Button 组件');
        }
        this._collectSprites();
        this.node.on(Node.EventType.TOUCH_START, this._onPress, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this._onRelease, this);
        this.node.on(Node.EventType.TOUCH_END, this._onRelease, this);
    }

    onDestroy() {
        this._stopTween();
        this.node.off(Node.EventType.TOUCH_START, this._onPress, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this._onRelease, this);
        this.node.off(Node.EventType.TOUCH_END, this._onRelease, this);
    }

    private _collectSprites() {
        this._sprites = [];
        const selfSprite = this.node.getComponent(Sprite);
        if (selfSprite) {
            this._sprites.push(selfSprite);
        } else {
            for (const child of this.node.children) {
                const sprite = child.getComponent(Sprite);
                if (sprite) {
                    this._sprites.push(sprite);
                }
            }
        }
    }

    private _onPress() {
        if (!this._button || !this._button.interactable) {
            return;
        }
        // 播放点击音效
        this.playClickSound();
        this._stopTween();
        const state: { scale: number; progress: number } = { scale: 1, progress: 0 };
        this._tween = tween(state)
            .to(this._duration, { scale: BUTTON_PRESS_SCALE, progress: 1 }, {
                easing: 'sineOut',
                onUpdate: () => {
                    this.node.setScale(state.scale, state.scale, 1);
                    this._sprites.forEach((sprite) => {
                        sprite.color = this._lerpColor(
                            BUTTON_ENABLED_TINT,
                            BUTTON_PRESS_COLOR,
                            state.progress,
                        );
                    });
                },
            })
            .start();
    }

    /** 播放点击音效 */
    private playClickSound(): void {
        playSFX('点击', { volume: 1.0 });
    }

    private _onRelease() {
        if (!this._button || !this._button.interactable) {
            this._stopTween();
            this.node.setScale(1, 1, 1);
            return;
        }
        this._stopTween();
        const state: { scale: number; progress: number } = { scale: BUTTON_PRESS_SCALE, progress: 1 };
        this._tween = tween(state)
            .to(this._duration, { scale: 1, progress: 0 }, {
                easing: 'sineOut',
                onUpdate: () => {
                    this.node.setScale(state.scale, state.scale, 1);
                    this._sprites.forEach((sprite) => {
                        sprite.color = this._lerpColor(
                            BUTTON_ENABLED_TINT,
                            BUTTON_PRESS_COLOR,
                            state.progress,
                        );
                    });
                },
            })
            .start();
    }

    private _lerpColor(from: Color, to: Color, t: number): Color {
        return new Color(
            Math.round(from.r + (to.r - from.r) * t),
            Math.round(from.g + (to.g - from.g) * t),
            Math.round(from.b + (to.b - from.b) * t),
            Math.round(from.a + (to.a - from.a) * t),
        );
    }

    private _stopTween() {
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
    }

}
