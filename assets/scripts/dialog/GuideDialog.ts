import { _decorator, Button, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

declare const GM: any;

@ccclass('GuideDialog')
export class GuideDialog extends Component {
  @property(Node)
  closeBtn: Node | null = null;

  private boundCloseBtn: Node | null = null;

  onLoad(): void {
    this.boundCloseBtn = this.resolveCloseBtn();
    this.bindCloseButton(this.boundCloseBtn);
  }

  private resolveCloseBtn(): Node {
    if (this.closeBtn) return this.closeBtn;
    const fromUpper = this.node.getChildByName('CloseBtn');
    if (fromUpper) return fromUpper;
    const fromLower = this.node.getChildByName('closeBtn');
    if (fromLower) return fromLower;
    throw new Error('GuideDialog 缺少 closeBtn/CloseBtn 节点');
  }

  private bindCloseButton(node: Node): void {
    const button = node.getComponent(Button);
    if (!button) {
      throw new Error('GuideDialog closeBtn 缺少 Button 组件');
    }
    node.on(Button.EventType.CLICK, this.onCloseClick, this);
  }

  private onCloseClick(): void {
    GM.dialog.close();
    GM.event.emit('guideDialogClosed');
  }
}
