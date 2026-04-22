/**
 * Win Dialog Component
 *
 * Displayed when player completes a level.
 * Has Back (to level selection) and Next (next level) buttons.
 */

import { _decorator, Component, Node, Button, Label } from 'cc';
import { Repo } from '../game/Repo';

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

  onLoad(): void {
    this.setupButton(this.backBtn, this.onBackClick.bind(this));
    this.setupButton(this.nextBtn, this.onNextClick.bind(this));

    // Register for events
    GM.event.on('openWinDialog', this.onOpenDialog.bind(this));
  }

  onDestroy(): void {
    GM.event.off('openWinDialog', this.onOpenDialog.bind(this));
  }

  /**
   * Handle dialog open event
   */
  private onOpenDialog(data: { level?: number; nextLevel?: number } = {}): void {
    // Update level display
    if (this.levelLabel) {
      const label = this.levelLabel.getComponent(Label);
      if (label) {
        label.string = data.nextLevel ? `Level ${data.nextLevel}` : 'Level Complete';
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

    // Check if next level exists
    try {
      Repo.get(nextLevel);

      // Update and start next level
      window.GM?.data?.setState({ currentLevel: nextLevel });
      GM.event.emit('startLevel', { level: nextLevel });
      this.closeDialog();
    } catch (e) {
      // No next level, go back to level selection
      GM.event.emit('backToLevelSelection');
      this.closeDialog();
    }
  }

  /**
   * Close this dialog
   */
  private closeDialog(): void {
    GM.dialog.close(this.node);
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