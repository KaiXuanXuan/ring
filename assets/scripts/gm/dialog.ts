/**
 * Dialog Module Implementation
 * Provides single-layer dialog management with auto-masking.
 */

import { Node, UITransform, Color, Sprite, Widget, SpriteFrame, Texture2D, BlockInputEvents } from 'cc';
import type { DialogModule as IDialogModule, EventModule, PrefabModule } from './types';

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
   * Should be called once during initialization with the canvas node.
   * @param parent - Parent node (typically canvas)
   */
  setParent(parent: Node): void {
    this.parent = parent;
  }

  /**
   * Open a dialog from prefab path.
   * Closes any existing dialog first (single-layer behavior).
   * Auto-creates semi-transparent mask behind dialog.
   * Silent fail - returns undefined if prefab not found or parent not set.
   * Emits 'dialogOpen' event with { node, path } payload on success.
   *
   * @param config - Configuration object for dialog opening
   * @param config.path - Resources path to dialog prefab (e.g., 'prefabs/ConfirmDialog')
   * @param config.parent - Optional parent node (defaults to parent set via setParent())
   * @returns Promise resolving to the dialog Node, or undefined on failure
   */
  async open(config: { path: string; parent?: Node }): Promise<Node | undefined> {
    const { path, parent: configParent } = config;

    // Validate path
    if (!path) {
      return undefined;
    }

    // Use config parent or fall back to default parent
    const parent = configParent ?? this.parent;

    // Validate parent
    if (!parent) {
      console.error('[DialogModule] Parent not set. Provide parent in config or call setParent() first.');
      return undefined;
    }

    // Close existing dialog (single-layer constraint - DIALOG-03)
    if (this.currentDialog) {
      this.close();
    }

    // Create mask node first
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

    // Emit event
    this.event.emit('dialogOpen', { node: dialog, path });

    return dialog;
  }

  /**
   * Close the current dialog.
   * Destroys both dialog and mask.
   * Emits 'dialogClose' event with { node, path } payload.
   * Safe to call when no dialog is open (no-op).
   */
  close(): void {
    if (!this.currentDialog) {
      return; // No dialog open, nothing to do
    }

    // Emit event before destruction (DIALOG-05)
    this.event.emit('dialogClose', {
      node: this.currentDialog,
      path: this.currentPath
    });

    // Destroy dialog using PrefabModule (DIALOG-04, DIALOG-05)
    this.prefab.destroy(this.currentDialog);

    // Destroy mask directly
    if (this.currentMask) {
      this.currentMask.destroy();
    }

    // Clear references
    this.currentDialog = null;
    this.currentMask = null;
    this.currentPath = '';
  }

  /**
   * 从模块上卸下当前弹窗/遮罩的引用，不调用 destroy。用于整场景即将被 director.loadScene 卸载时（例如重玩），
   * 避免先 close() 导致遮罩消失、露出底层一帧再切场景造成的闪烁。
   */
  detachOpenDialog(): void {
    this.currentDialog = null;
    this.currentMask = null;
    this.currentPath = '';
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