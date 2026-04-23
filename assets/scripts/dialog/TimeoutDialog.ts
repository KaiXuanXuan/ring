/**
 * Timeout Dialog Component
 *
 * Displayed when time runs out.
 * Has Back (to level selection) and GetTime buttons.
 * When CloseBtn is clicked, opens FailDialog.
 */

import { _decorator, Component, Node, Button } from 'cc';
import { AdService } from '../service/AdService';

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

  onLoad(): void {
    this.setupButton(this.backBtn, this.onBackClick.bind(this));
    this.setupButton(this.getTimeBtn, this.onGetTimeClick.bind(this));
    this.setupButton(this.closeBtn, this.onCloseClick.bind(this));
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
    AdService.showInterstitial(() => {
      GM.event.emit('addTime', { seconds: 60 });
      GM.event.emit('resumeTimer');
      this.closeDialog();
    });
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