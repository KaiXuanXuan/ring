/**
 * Timeout Dialog Component
 *
 * Displayed when time runs out.
 * Has Back (to level selection) and GetTime buttons.
 * When CloseBtn is clicked, opens FailDialog.
 */

import { _decorator, Component, Node, Button } from 'cc';

const { ccclass, property } = _decorator;

// GM is attached to window after initialization
declare const GM: any;

@ccclass('TimeoutDialog')
export class TimeoutDialog extends Component {
  @property(Node)
  backBtn: Node | null = null; // Back button node

  @property(Node)
  getTimeBtn: Node | null = null; // GetTime button node

  @property(Node)
  closeBtn: Node | null = null; // Close button node

  private readonly onBackClick = this.onBackClick.bind(this);
  private readonly onGetTimeClick = this.onGetTimeClick.bind(this);
  private readonly onCloseClick = this.onCloseClick.bind(this);

  onLoad(): void {
    this.setupButton(this.backBtn, this.onBackClick);
    this.setupButton(this.getTimeBtn, this.onGetTimeClick);
    this.setupButton(this.closeBtn, this.onCloseClick);
  }

  /**
   * Handle Back button click - return to level selection
   */
  private onBackClick(): void {
    GM.event.emit('backToLevelSelection');
    this.closeDialog();
  }

  /**
   * Handle GetTime button click - add 60 seconds and resume
   */
  private onGetTimeClick(): void {
    GM.event.emit('addTime', { seconds: 60 });
    GM.event.emit('resumeTimer');
    this.closeDialog();
  }

  /**
   * Handle Close button click - open FailDialog
   */
  private onCloseClick(): void {
    this.closeDialog();
    GM.event.emit('openFailDialog');
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