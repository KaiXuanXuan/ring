import { Button, Color, Sprite, tween } from 'cc';

const BUTTON_ENABLED_TINT = Color.WHITE.clone();
const BUTTON_DISABLED_TINT = new Color(136, 136, 136, 102);
const BUTTON_TINT_ANIM_DURATION = 0.2;

const getButtonTargetSprite = (button: Button): Sprite | null => {
    const targetNode = button.target ?? button.node;
    return targetNode.getComponent(Sprite);
};

export const updateButtonEnabledState = (button: Button, enabled: boolean): void => {
    button.interactable = enabled;
    const sprite = getButtonTargetSprite(button);
    if (!sprite) return;

    const from = sprite.color.clone();
    const to = enabled ? BUTTON_ENABLED_TINT : BUTTON_DISABLED_TINT;
    const state = { r: from.r, g: from.g, b: from.b, a: from.a };

    tween(state)
        .to(BUTTON_TINT_ANIM_DURATION, { r: to.r, g: to.g, b: to.b, a: to.a }, {
            easing: 'sineOut',
            onUpdate: () => sprite.color = new Color(state.r, state.g, state.b, state.a),
        })
        .call(() => {
            sprite.color = to.clone();
        })
        .start();
};
