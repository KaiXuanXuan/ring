/**
 * Win Dialog Component
 *
 * Displayed when player completes a level.
 * Has Back (to level selection) and Next (next level) buttons.
 */

import { _decorator, Component, Node, Button, Label } from 'cc';
import { getLevelConfig } from '../config/LevelConfig';
import { LevelConfig } from '../game/Types';

const { ccclass, property } = _decorator;

// GM is attached to window after initialization
declare const GM: any;

@ccclass('WinDialog')
export class WinDialog extends Component {
  @property(Node)
  backBtn: Node | null = null; // Back button node

  @property(Node)
  nextBtn: Node | null = null; // Next button node

  @property(Node)
  levelLabel: Node | null = null; // Level label node
  private readonly onOpenDialogHandler = this.onOpenDialog.bind(this);

  onLoad(): void {
    this.setupButton(this.backBtn, this.onBackClick.bind(this));
    this.setupButton(this.nextBtn, this.onNextClick.bind(this));

    // Register for events
    GM.event.on('openWinDialog', this.onOpenDialogHandler);
  }

  onDestroy(): void {
    GM.event.off('openWinDialog', this.onOpenDialogHandler);
  }

  /**
   * Handle dialog open event
   */
  private onOpenDialog(data: { level?: number; nextLevel?: number } = {}): void {
    // Update level display
    if (this.levelLabel) {
      const label = this.levelLabel.getComponent(Label);
      if (label && data.nextLevel && data.level) {
        if (data.level === data.nextLevel) {
          label.string = 'Level Complete';
        } else {
          label.string = `Level ${data.nextLevel}`;
        }
      }
    }
  }

  /**
   * Handle Back button click - return to level selection
   */
  private onBackClick(): void {
    GM.event.emit('backToLevelSelection');
    this.closeDialog();
  }

  /**
   * Handle Next button click - start next level
   */
  private onNextClick(): void {
    const currentLevel = window.GM?.data?.getState('currentLevel') ?? 1;
    const nextLevel = currentLevel + 1;

    if (!this.hasPlayableLevel(nextLevel)) {
      GM.event.emit('backToLevelSelection');
      this.closeDialog();
      return;
    }

    // Update and start next level
    window.GM?.data?.setState({ currentLevel: nextLevel });
    GM.event.emit('startLevel', { level: nextLevel });
    this.closeDialog();
  }

  private hasPlayableLevel(level: number): boolean {
    let cfg: LevelConfig;
    try {
      cfg = getLevelConfig(level);
    } catch {
      return false;
    }
    return Array.isArray(cfg.rings) && cfg.rings.length > 0;
  }

  /**
   * Close this dialog
   */
  private closeDialog(): void {
    GM.dialog.close();
  }

  /**
   * Setup button click handler
   */
  private setupButton(btnNode: Node | null, handler: () => void): void {
    if (!btnNode) return;
    const button = btnNode.getComponent(Button);
    if (button) {
      button.node.on(Button.EventType.CLICK, handler);
    }
  }
}