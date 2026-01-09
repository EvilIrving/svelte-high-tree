import type { FlatNode, TreeIndex } from '@light-cat/treekit-core';
import type { SearchConfig } from '@light-cat/treekit-core';
import { getAncestorSet } from '@light-cat/treekit-core';

/**
 * 导航结果
 */
export interface NavigateResult {
  /** 当前节点 ID，null 表示无匹配 */
  id: string | null;
  /** 需要展开的祖先节点 ID 集合 */
  expandIds: Set<string>;
  /** 是否成功导航（用于边界提示） */
  success: boolean;
}

/**
 * 搜索导航控制器
 * 管理搜索结果的上一个/下一个跳转
 *
 * 只有 enableNavigation 为 true 时才会进行初始化
 */
export class SearchNavigator {
  private config: SearchConfig;
  private flatNodes: FlatNode[] = [];
  private index: TreeIndex | null = null;

  // ========== 响应式状态 ==========

  private _matchList = $state.raw<string[]>([]); // 按 flatNodes 顺序的匹配 ID 列表
  private _currentIndex = $state(-1);

  constructor(config: SearchConfig) {
    this.config = config;
  }

  // ========== 访问器 ==========
  /** 当前索引 */
  get currentIndex(): number {
    return this._currentIndex;
  }

  /** 匹配列表 */
  get matchList(): string[] {
    return this._matchList;
  }

  /** 当前聚焦的节点 ID */
  get currentId(): string | null {
    return this._currentIndex >= 0 && this._currentIndex < this._matchList.length
      ? this._matchList[this._currentIndex]
      : null;
  }

  /** 匹配总数（仅 showCount 开启时有值） */
  get total(): number | undefined {
    return this.config.showCount ? this._matchList.length : undefined;
  }

  /** 当前位置（1-based，仅 showCount 开启且有匹配时有值） */
  get current(): number | undefined {
    return this.config.showCount && this._currentIndex >= 0 ? this._currentIndex + 1 : undefined;
  }

  /** 是否有匹配结果 */
  get hasMatches(): boolean {
    return this._matchList.length > 0;
  }

  /**
   * 初始化数据源
   * 只有 enableNavigation 为 true 时才需要调用
   */
  init(flatNodes: FlatNode[], index: TreeIndex): void {
    if (!this.config.enableNavigation) return;

    this.flatNodes = flatNodes;
    this.index = index;
  }

  /**
   * 更新匹配列表
   * 按 flatNodes 顺序排列匹配 ID，并默认选中第一个
   */
  updateMatches(matchIds: Set<string>): NavigateResult {
    if (!this.config.enableNavigation) {
      return { id: null, expandIds: new Set(), success: false };
    }

    // 按 flatNodes 顺序过滤
    this._matchList = this.flatNodes
      .filter((n) => matchIds.has(n.id))
      .map((n) => n.id);

    // 默认选中第一个
    this._currentIndex = this._matchList.length > 0 ? 0 : -1;

    return this.getCurrentWithAncestors(true);
  }

  /**
   * 跳转到下一个匹配项
   * @returns NavigateResult，success 为 false 表示已到最后一个且不循环
   */
  next(): NavigateResult {
    if (!this.config.enableNavigation || this._matchList.length === 0) {
      return { id: null, expandIds: new Set(), success: false };
    }

    if (this._currentIndex < this._matchList.length - 1) {
      this._currentIndex++;
      return this.getCurrentWithAncestors(true);
    }

    // 已在最后一个
    if (this.config.enableLoop) {
      this._currentIndex = 0;
      return this.getCurrentWithAncestors(true);
    }

    // 不循环，返回当前但标记失败（用于提示）
    return this.getCurrentWithAncestors(false);
  }

  /**
   * 跳转到上一个匹配项
   * @returns NavigateResult，success 为 false 表示已到第一个且不循环
   */
  prev(): NavigateResult {
    if (!this.config.enableNavigation || this._matchList.length === 0) {
      return { id: null, expandIds: new Set(), success: false };
    }

    if (this._currentIndex > 0) {
      this._currentIndex--;
      return this.getCurrentWithAncestors(true);
    }

    // 已在第一个
    if (this.config.enableLoop) {
      this._currentIndex = this._matchList.length - 1;
      return this.getCurrentWithAncestors(true);
    }

    // 不循环，返回当前但标记失败（用于提示）
    return this.getCurrentWithAncestors(false);
  }

  /**
   * 跳转到指定索引
   */
  goTo(index: number): NavigateResult {
    if (!this.config.enableNavigation || this._matchList.length === 0) {
      return { id: null, expandIds: new Set(), success: false };
    }

    if (index >= 0 && index < this._matchList.length) {
      this._currentIndex = index;
      return this.getCurrentWithAncestors(true);
    }

    return { id: null, expandIds: new Set(), success: false };
  }

  /**
   * 重置导航状态
   */
  reset(): void {
    this._matchList = [];
    this._currentIndex = -1;
  }

  /**
   * 获取当前节点及其祖先
   */
  private getCurrentWithAncestors(success: boolean): NavigateResult {
    const id = this.currentId;
    if (!id) {
      return { id: null, expandIds: new Set(), success: false };
    }

    const expandIds = this.collectAncestorIds(id);
    return { id, expandIds, success };
  }

  /**
   * 收集节点的所有祖先 ID
   */
  private collectAncestorIds(nodeId: string): Set<string> {
    if (!this.index) return new Set();
    return getAncestorSet(nodeId, this.index.nodeMap);
  }
}

/**
 * 创建搜索导航器实例
 */
export function createSearchNavigator(config: SearchConfig): SearchNavigator {
  return new SearchNavigator(config);
}
