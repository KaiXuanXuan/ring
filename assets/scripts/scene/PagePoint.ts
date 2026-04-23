import { _decorator, Component, Node, Prefab, instantiate } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('PagePoint')
export class PagePoint extends Component {
  @property(Node)
  currentNode: Node | null = null;

  @property(Node)
  notCurrentNode: Node | null = null;

  private pageIndex = 0;

  onLoad(): void {
    this.currentNode = this.currentNode ?? this.node.getChildByName('Current');
    this.notCurrentNode = this.notCurrentNode ?? this.node.getChildByName('NotCurrent');
    if (!this.currentNode || !this.notCurrentNode) {
      throw new Error('PagePoint 节点结构不完整：需要 Current/NotCurrent');
    }
  }

  setup(pageIndex: number, isCurrent: boolean): void {
    if (!Number.isInteger(pageIndex) || pageIndex < 0) {
      throw new Error(`PagePoint.setup pageIndex 非法: ${pageIndex}`);
    }
    this.pageIndex = pageIndex;
    this.setCurrent(isCurrent);
  }

  setCurrent(isCurrent: boolean): void {
    if (!this.currentNode || !this.notCurrentNode) {
      throw new Error('PagePoint 尚未初始化完成');
    }
    this.currentNode.active = isCurrent;
    this.notCurrentNode.active = !isCurrent;
  }

  getPageIndex(): number {
    return this.pageIndex;
  }

  static render(container: Node, pointPrefab: Prefab, totalPages: number, currentPage: number): PagePoint[] {
    if (!container) {
      throw new Error('PagePoint.render 缺少 container');
    }
    if (!pointPrefab) {
      throw new Error('PagePoint.render 缺少 pointPrefab');
    }
    if (!Number.isInteger(totalPages) || totalPages < 0) {
      throw new Error(`PagePoint.render totalPages 非法: ${totalPages}`);
    }
    if (totalPages === 0) {
      container.removeAllChildren();
      return [];
    }
    if (!Number.isInteger(currentPage) || currentPage < 0 || currentPage >= totalPages) {
      throw new Error(`PagePoint.render currentPage 非法: ${currentPage}, totalPages=${totalPages}`);
    }

    while (container.children.length > totalPages) {
      const last = container.children[container.children.length - 1];
      last.destroy();
    }

    while (container.children.length < totalPages) {
      const pointNode = instantiate(pointPrefab);
      container.addChild(pointNode);
    }

    const comps: PagePoint[] = [];
    for (let i = 0; i < totalPages; i++) {
      const pointNode = container.children[i];
      const comp = pointNode.getComponent(PagePoint) || pointNode.addComponent(PagePoint);
      comp.setup(i, i === currentPage);
      comps.push(comp);
    }
    return comps;
  }
}
