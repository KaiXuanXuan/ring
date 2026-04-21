import { Color } from 'cc';

export const UI_CONFIG = {
    /** 按钮可用时的混合色 */
    BUTTON_ENABLED_TINT: Color.WHITE.clone(),
    /** 按钮禁用时的混合色（#888888 + 0.4 透明度） */
    BUTTON_DISABLED_TINT: new Color(136, 136, 136, 102),
    /** 按钮状态切换渐变时长（秒） */
    BUTTON_TINT_ANIM_DURATION: 0.2,
    /** 按钮按压时的缩放比例 */
    BUTTON_PRESS_SCALE: 0.9,
    /** 按钮按压动画时长（秒） */
    BUTTON_PRESS_ANIM_DURATION: 0.1,
    /** 按钮按压时的颜色（#CCCCCC） */
    BUTTON_PRESS_COLOR: new Color(204, 204, 204, 255),
} as const;
