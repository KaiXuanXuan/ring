import { _decorator, Component, EventTouch, Layout, Node, Prefab, UITransform, Vec3, instantiate, tween } from 'cc';
import { getAllLevelIds } from '../config/LevelConfig';
import { LevelCard } from './LevelCard';
import { PagePoint } from './PagePoint';

const { ccclass, property } = _decorator;

@ccclass('LevelSelection')
export class LevelSelection extends Component {
  @property(Node)
  viewport: Node | null = null;

  @property(Node)
  pageContent: Node | null = null;

  @property(Node)
  pagePointContainer: Node | null = null;

  @property(Prefab)
  levelCardPrefab: Prefab | null = null;

  @property(Prefab)
  pagePointPrefab: Prefab | null = null;

  private readonly perPage = 9;
  private readonly cols = 3;
  private readonly rows = 3;
  private readonly swipeThreshold = 60;
  private currentPage = 0;
  private totalPages = 0;
  private pageWidth = 0;
  private levelIds: number[] = [];
  private touchStartX = 0;

  onLoad(): void {
    if (!this.viewport || !this.pageContent || !this.pagePointContainer || !this.levelCardPrefab || !this.pagePointPrefab) {
      throw new Error('LevelSelection 缺少必要绑定：viewport/pageContent/pagePointContainer/levelCardPrefab/pagePointPrefab');
    }
    const viewportTransform = this.viewport.getComponent(UITransform);
    if (!viewportTransform) {
      throw new Error('LevelSelection.viewport 缺少 UITransform');
    }
    this.pageWidth = viewportTransform.width;
    if (this.pageWidth <= 0) {
      throw new Error(`LevelSelection.pageWidth 非法: ${this.pageWidth}`);
    }

    this.levelIds = getAllLevelIds().sort((a, b) => a - b);
    if (this.levelIds.length === 0) {
      throw new Error('LevelSelection 没有可用关卡');
    }

    this.totalPages = Math.ceil(this.levelIds.length / this.perPage);
    this.buildPages();
    this.renderPoints();
    this.snapToPage(0);

    this.viewport.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.viewport.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.viewport.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  onDestroy(): void {
    this.viewport?.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.viewport?.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.viewport?.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  private buildPages(): void {
    if (!this.viewport || !this.pageContent || !this.levelCardPrefab) {
      throw new Error('LevelSelection.buildPages 调用时缺少必要绑定');
    }
    this.pageContent.removeAllChildren();

    const viewportTransform = this.viewport.getComponent(UITransform);
    if (!viewportTransform) {
      throw new Error('LevelSelection.viewport 缺少 UITransform');
    }
    const pageHeight = viewportTransform.height;
    if (pageHeight <= 0) {
      throw new Error(`LevelSelection.pageHeight 非法: ${pageHeight}`);
    }

    const cellW = this.pageWidth / this.cols;
    const cellH = pageHeight / this.rows;

    for (let page = 0; page < this.totalPages; page++) {
      const pageNode = new Node(`Page${page + 1}`);
      const pageTransform = pageNode.addComponent(UITransform);
      pageTransform.setContentSize(this.pageWidth, pageHeight);
      pageNode.setPosition(page * this.pageWidth, 0, 0);
      this.pageContent.addChild(pageNode);

      const start = page * this.perPage;
      const end = Math.min(start + this.perPage, this.levelIds.length);
      for (let i = start; i < end; i++) {
        const level = this.levelIds[i];
        const local = i - start;
        const row = Math.floor(local / this.cols);
        const col = local % this.cols;

        const cardNode = instantiate(this.levelCardPrefab);
        cardNode.name = `LevelCard_${level}`;
        const x = -this.pageWidth * 0.5 + cellW * (col + 0.5);
        const y = pageHeight * 0.5 - cellH * (row + 0.5);
        cardNode.setPosition(x, y, 0);
        pageNode.addChild(cardNode);

        const cardComp = cardNode.getComponent(LevelCard) || cardNode.addComponent(LevelCard);
        cardComp.setup(level);
      }
    }

    const contentTransform = this.pageContent.getComponent(UITransform) || this.pageContent.addComponent(UITransform);
    contentTransform.setContentSize(this.pageWidth * this.totalPages, pageHeight);
  }

  private renderPoints(): void {
    if (!this.pagePointContainer || !this.pagePointPrefab) {
      throw new Error('LevelSelection.renderPoints 调用时缺少必要绑定');
    }
    PagePoint.render(this.pagePointContainer, this.pagePointPrefab, this.totalPages, this.currentPage);
    this.applyPagePointContainerLayout();
  }

  private applyPagePointContainerLayout(): void {
    if (!this.pagePointContainer) {
      return;
    }
    const layout = this.pagePointContainer.getComponent(Layout);
    if (layout) {
      layout.resizeMode = Layout.ResizeMode.CONTAINER;
      layout.updateLayout(true);
    }
    const p = this.pagePointContainer.position;
    this.pagePointContainer.setPosition(0, p.y, p.z);
  }

  private onTouchStart(event: EventTouch): void {
    this.touchStartX = event.getUILocation().x;
  }

  private onTouchEnd(event: EventTouch): void {
    const endX = event.getUILocation().x;
    const deltaX = endX - this.touchStartX;
    if (deltaX >= this.swipeThreshold) {
      this.goPrevPage();
      return;
    }
    if (deltaX <= -this.swipeThreshold) {
      this.goNextPage();
    }
  }

  private goPrevPage(): void {
    if (this.currentPage <= 0) return;
    this.currentPage -= 1;
    this.animateToCurrentPage();
  }

  private goNextPage(): void {
    if (this.currentPage >= this.totalPages - 1) return;
    this.currentPage += 1;
    this.animateToCurrentPage();
  }

  private animateToCurrentPage(): void {
    if (!this.pageContent) {
      throw new Error('LevelSelection.animateToCurrentPage 缺少 pageContent');
    }
    const targetX = -this.currentPage * this.pageWidth;
    tween(this.pageContent)
      .stop()
      .to(0.2, { position: new Vec3(targetX, 0, 0) })
      .call(() => this.renderPoints())
      .start();
  }

  private snapToPage(page: number): void {
    if (!this.pageContent) {
      throw new Error('LevelSelection.snapToPage 缺少 pageContent');
    }
    if (!Number.isInteger(page) || page < 0 || page >= this.totalPages) {
      throw new Error(`LevelSelection.snapToPage page 非法: ${page}`);
    }
    this.currentPage = page;
    this.pageContent.setPosition(-this.currentPage * this.pageWidth, 0, 0);
    this.renderPoints();
  }
}
