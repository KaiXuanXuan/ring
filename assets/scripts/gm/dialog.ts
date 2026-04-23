/**
 * Dialog Module Implementation
 * Provides single-layer dialog management with auto-masking.
 */

import { Node, UITransform, Color, Sprite, Widget, SpriteFrame, Texture2D, BlockInputEvents, UIOpacity, tween, Tween, Vec3, director } from 'cc';
import type { DialogModule as IDialogModule, EventModule, PrefabModule, DialogOpenConfig, DialogCloseConfig } from './types';

/**
 * DialogModule Implementation
 * Manages dialog lifecycle with automatic mask creation and single-layer behavior.
 */
export class DialogModule implements IDialogModule {
  /** Event module reference for emitting dialog events */
  private event: EventModule;

  /** Prefab module reference for loading dialog prefabs */
  private prefab: PrefabModule;

  /** Currently open dialog node (null if none) */
  private currentDialog: Node | null = null;

  /** Current mask node (null if none) */
  private currentMask: Node | null = null;

  /** Path of current dialog (empty if none) */
  private currentPath: string = '';

  /** Parent node for dialogs and masks */
  private parent: Node | null = null;

  /** Current close animation tween (if any) */
  private closeTween: Tween<any> | null = null;

  /** Current open animation tween (if any) */
  private openTween: Tween<any> | null = null;

  /** Default animation configuration */
  private defaultAnimationConfig = {
    enabled: true,
    duration: 0.3,
  };

  /**
   * Create a DialogModule instance.
   * @param event - EventModule reference for emitting 'dialogOpen' and 'dialogClose' events
   * @param prefab - PrefabModule reference for loading dialog prefabs
   */
  constructor(event: EventModule, prefab: PrefabModule) {
    this.event = event;
    this.prefab = prefab;
  }

  /**
   * Set the parent node for dialogs and masks.
   * Internal use only for maintaining single-layer dialog behavior.
   * @param parent - Parent node (typically canvas)
   */
  private setParent(parent: Node): void {
    this.parent = parent;
  }

  /**
   * Open a dialog from prefab path.
   * Closes any existing dialog first (single-layer behavior).
   * Auto-creates semi-transparent mask behind dialog.
   * Silent fail - returns undefined if prefab not found.
   * Emits 'dialogOpen' event with { node, path } payload on success.
   *
   * @param config.path - Resources path to dialog prefab (e.g., 'prefabs/ConfirmDialog')
   * @param config.parent - Parent node for dialog and mask (optional, defaults to Canvas if not provided)
   * @param config.animation - Optional animation configuration
   * @param config.animation.enabled - Whether animation is enabled (default: true)
   * @param config.animation.duration - Animation duration in seconds (default: 0.3)
   * @returns Promise resolving to the dialog Node, or undefined on failure
   */
  async open(config: DialogOpenConfig): Promise<Node | undefined> {
    const { path, parent: configParent, animation: animConfig } = config;

    // Validate path
    if (!path) {
      console.error('[DialogModule] Path is required. Provide a valid prefab path in config.');
      return undefined;
    }

    // Get parent from config or auto-resolve from scene
    let parent = configParent;
    if (!parent) {
      // Try to get Canvas from current scene
      const scene = director.getScene();
      if (scene) {
        parent = scene.getChildByName('Canvas');
      }
      if (!parent) {
        console.error('[DialogModule] Parent is required. Provide parent in config or ensure Canvas exists in scene.');
        return undefined;
      }
    }

    // Store parent for future use (single-layer behavior)
    this.parent = parent;

    // Merge animation config with defaults
    const animation = {
      enabled: animConfig?.enabled ?? this.defaultAnimationConfig.enabled,
      duration: animConfig?.duration ?? this.defaultAnimationConfig.duration,
    };

    // Close existing dialog (single-layer constraint - DIALOG-03)
    // Wait for close animation if enabled
    if (this.currentDialog) {
      await this.close({ animation });
    }

    // Create mask node first (mask has no animation)
    const mask = this.createMask();
    this.currentMask = mask;

    // Load dialog prefab using PrefabModule (DIALOG-01)
    const dialog = await this.prefab.create({
      path,
      parent,
      position: undefined
    });

    if (!dialog) {
      // Clean up mask if dialog failed to load
      mask.destroy();
      this.currentMask = null;
      return undefined;
    }

    // Find dialog's index and insert mask at that position
    // This will push the dialog to index+1 (above the mask)
    const dialogIndex = dialog.getSiblingIndex();
    parent.insertChild(mask, dialogIndex);

    // Store reference
    this.currentDialog = dialog;
    this.currentPath = path;

    // Apply open animation if enabled
    if (animation.enabled) {
      await this.playOpenAnimation(dialog, animation.duration);
    }

    // Emit event
    this.event.emit('dialogOpen', { node: dialog, path });

    return dialog;
  }

  /**
   * Close the current dialog.
   * Destroys both dialog and mask.
   * Emits 'dialogClose' event with { node, path } payload.
   * Safe to call when no dialog is open (no-op).
   *
   * @param config.animation - Optional animation configuration
   * @param config.animation.enabled - Whether animation is enabled (default: true)
   * @param config.animation.duration - Animation duration in seconds (default: 0.3)
   * @returns Promise that resolves when dialog is closed and destroyed
   */
  async close(config?: DialogCloseConfig): Promise<void> {
    if (!this.currentDialog) {
      return; // No dialog open, nothing to do
    }

    // Merge animation config with defaults
    const animation = {
      enabled: config?.animation?.enabled ?? this.defaultAnimationConfig.enabled,
      duration: config?.animation?.duration ?? this.defaultAnimationConfig.duration,
    };

    // Store references for cleanup
    const dialog = this.currentDialog;
    const mask = this.currentMask;
    const path = this.currentPath;

    // Emit event before animation starts (DIALOG-05)
    this.event.emit('dialogClose', { node: dialog, path });

    // Play close animation if enabled, otherwise destroy immediately
    if (animation.enabled) {
      await this.playCloseAnimation(dialog, animation.duration);
    }

    // Destroy mask immediately (no animation)
    if (mask) {
      mask.destroy();
    }

    // Destroy dialog using PrefabModule (DIALOG-04, DIALOG-05)
    // Stop any remaining animations before destroy
    Tween.stopAllByTarget(dialog);
    this.prefab.destroy(dialog);

    // Clear references
    this.currentDialog = null;
    this.currentMask = null;
    this.currentPath = '';
    this.closeTween = null;
  }

  /**
   * 从模块上卸下当前弹窗/遮罩的引用，不调用 destroy。用于整场景即将被 director.loadScene 卸载时（例如重玩），
   * 避免先 close() 导致遮罩消失、露出底层一帧再切场景造成的闪烁。
   */
  detachOpenDialog(): void {
    // Stop any running animations
    if (this.openTween) {
      this.openTween.stop();
      this.openTween = null;
    }
    if (this.closeTween) {
      this.closeTween.stop();
      this.closeTween = null;
    }

    this.currentDialog = null;
    this.currentMask = null;
    this.currentPath = '';
  }

  /**
   * Play open animation for dialog node.
   * Animates from scale 0.5/opacity 0 to scale 1/opacity 255 with backOut easing.
   * @param dialog - Dialog node to animate
   * @param duration - Animation duration in seconds
   * @returns Promise that resolves when animation completes
   */
  private playOpenAnimation(dialog: Node, duration: number): Promise<void> {
    return new Promise<void>((resolve) => {
      // Ensure UIOpacity component exists
      let opacityComp = dialog.getComponent(UIOpacity);
      if (!opacityComp) {
        opacityComp = dialog.addComponent(UIOpacity);
      }

      // Set initial state: small scale and transparent
      dialog.setScale(0.5, 0.5, 1);
      opacityComp.opacity = 0;

      // Stop any existing animation
      Tween.stopAllByTarget(dialog);

      // Create animation state object
      const state = {
        scale: 0.5,
        opacity: 0,
      };

      // Play animation
      this.openTween = tween(state)
        .to(duration, {
          scale: 1,
          opacity: 255,
        }, {
          easing: 'backOut',
          onUpdate: () => {
            dialog.setScale(state.scale, state.scale, 1);
            opacityComp.opacity = Math.floor(state.opacity);
          },
        })
        .call(() => {
          // Ensure final values are set
          dialog.setScale(1, 1, 1);
          opacityComp.opacity = 255;
          this.openTween = null;
          resolve();
        })
        .start();
    });
  }

  /**
   * Play close animation for dialog node.
   * Animates from scale 1/opacity 255 to scale 0.5/opacity 0 with backIn easing.
   * @param dialog - Dialog node to animate
   * @param duration - Animation duration in seconds
   * @returns Promise that resolves when animation completes
   */
  private playCloseAnimation(dialog: Node, duration: number): Promise<void> {
    return new Promise<void>((resolve) => {
      // Ensure UIOpacity component exists
      let opacityComp = dialog.getComponent(UIOpacity);
      if (!opacityComp) {
        opacityComp = dialog.addComponent(UIOpacity);
      }

      // Stop any existing animation
      Tween.stopAllByTarget(dialog);

      // Create animation state object
      const state = {
        scale: 1,
        opacity: 255,
      };

      // Play animation
      this.closeTween = tween(state)
        .to(duration, {
          scale: 0.5,
          opacity: 0,
        }, {
          easing: 'backIn',
          onUpdate: () => {
            dialog.setScale(state.scale, state.scale, 1);
            opacityComp.opacity = Math.floor(state.opacity);
          },
        })
        .call(() => {
          // Ensure final values are set
          dialog.setScale(0.5, 0.5, 1);
          opacityComp.opacity = 0;
          this.closeTween = null;
          resolve();
        })
        .start();
    });
  }

  /**
   * Create a semi-transparent mask node.
   * Black background at 50% opacity (128/255).
   * Blocks interaction with underlying UI.
   *
   * @returns The created mask node (not yet added to parent)
   */
  private createMask(): Node {
    const mask = new Node('DialogMask');

    // Add UITransform for size (blocks input)
    mask.addComponent(UITransform);

    // Add Widget for size (blocks input)
    const w = mask.addComponent(Widget)
    w.isAlignTop = w.isAlignBottom = w.isAlignLeft = w.isAlignRight = true;
    w.left = w.right = w.top = w.bottom = 0;
    w.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
    w.updateAlignment();

    // Add Sprite for visual - black at 50% opacity (128/255)
    const sprite = mask.addComponent(Sprite);
    sprite.color = new Color(0, 0, 0, 128);
    sprite.spriteFrame = this.createDefaultSpriteFrame();

    // Add BlockInputEvents to prevent click-through to underlying UI
    mask.addComponent(BlockInputEvents);

    return mask;
  }

  /**
   * Create a default white sprite frame programmatically.
   * This is needed because Sprite components won't render without a sprite frame.
   *
   * @returns A simple white 1x1 sprite frame
   */
  private createDefaultSpriteFrame(): SpriteFrame {
    const texture = new Texture2D();
    texture.reset({
      width: 1,
      height: 1,
      format: Texture2D.PixelFormat.RGBA8888,
    });
    // Create white pixel data (RGBA)
    const data = new Uint8Array([255, 255, 255, 255]);
    texture.uploadData(data);

    const spriteFrame = new SpriteFrame();
    spriteFrame.texture = texture;
    return spriteFrame;
  }
}