/**
 * Fail Dialog Component
 *
 * Displayed after TimeoutDialog is closed.
 * Has Back (to level selection) and Replay (restart current level) buttons.
 */

import { _decorator, Component, Node, Button } from 'cc';

const { ccclass, property } = _decorator;

// GM is attached to window after initialization
declare const GM: any;

@ccclass('FailDialog')
export class FailDialog extends Component {
  @property(Node)
  backBtn: Node | null = null; // Back button node

  @property(Node)
  replayBtn: Node | null = null; // Replay button node

  private readonly onBackClick = this.onBackClick.bind(this);
  private readonly onReplayClick = this.onReplayClick.bind(this);

  onLoad(): void {
    this.setupButton(this.backBtn, this.onBackClick);
    this.setupButton(this.replayBtn, this.onReplayClick);
  }

  /**
   * Handle Back button click - return to level selection
   */
  private onBackClick(): void {
    GM.event.emit('backToLevelSelection');
    this.closeDialog();
  }

  /**
   * Handle Replay button click - restart current level
   */
  private onReplayClick(): void {
    const currentLevel = window.GM?.data?.getState<number>('currentLevel') ?? 1;
    GM.event.emit('startLevel', { level: currentLevel });
    this.closeDialog();
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