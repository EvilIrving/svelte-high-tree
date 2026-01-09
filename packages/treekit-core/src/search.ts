export interface SearchResult {
  matchIds: Set<string>;
  expandIds: Set<string>;
}

type SearchCallback = (result: SearchResult) => void;

/**
 * 搜索控制器
 * 管理 Web Worker 通信和防抖
 */
export class SearchController {
  private worker: Worker | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceMs: number;
  private onResult: SearchCallback;
  private isReady: boolean = false;
  private pendingSearch: string | null = null;

  constructor(options: { debounceMs?: number; onResult: SearchCallback }) {
    this.debounceMs = options.debounceMs ?? 200;
    this.onResult = options.onResult;
  }

  /**
   * 初始化 Worker
   * @param searchData 搜索数据，需要包含 id, name, parentId 字段
   */
  init(
    searchData: Array<{ id: string; name: string; parentId: string | null }>,
    workerUrl?: string
  ): void {
    // 支持自定义 worker URL（便于不同框架使用）
    const url = workerUrl ?? new URL('./search.worker.ts', import.meta.url);
    const urlObj = typeof url === 'string' ? new URL(url) : url;

    // 检查是否是 data URL（内联 worker），如果是则直接使用
    if (urlObj.protocol === 'data:') {
      this.worker = new Worker(urlObj, { type: 'module' });
    } else {
      this.worker = new Worker(urlObj, { type: 'module' });
    }

    this.worker.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;

      if (type === 'init-done') {
        this.isReady = true;
        // 如果有待处理的搜索，立即执行
        if (this.pendingSearch !== null) {
          this.searchImmediate(this.pendingSearch);
          this.pendingSearch = null;
        }
      }

      if (type === 'search-result' && payload) {
        this.onResult({
          matchIds: new Set(payload.matchIds),
          expandIds: new Set(payload.expandIds)
        });
      }
    };

    this.worker.onerror = (e: Event) => {
      console.error('Search worker error:', e);
    };

    // 发送初始化数据
    this.worker.postMessage({
      type: 'init',
      payload: {
        data: searchData.map((n) => ({
          id: n.id,
          name: n.name,
          parentId: n.parentId
        }))
      }
    });
  }

  /**
   * 执行搜索（带防抖）
   */
  search(keyword: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (keyword.trim() === '') {
      this.clear();
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.searchImmediate(keyword);
    }, this.debounceMs);
  }

  /**
   * 立即搜索（不防抖）
   */
  searchImmediate(keyword: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (keyword.trim() === '') {
      this.clear();
      return;
    }

    if (!this.isReady) {
      // Worker 还没准备好，暂存搜索请求
      this.pendingSearch = keyword;
      return;
    }

    this.worker?.postMessage({
      type: 'search',
      payload: { keyword }
    });
  }

  /**
   * 清除搜索
   */
  clear(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.onResult({
      matchIds: new Set(),
      expandIds: new Set()
    });
  }

  /**
   * 检查是否就绪
   */
  get ready(): boolean {
    return this.isReady;
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
  }
}

/**
 * 同步搜索（用于数据量较小或不支持 Worker 的场景）
 * 直接在主线程执行，适用于 < 5000 节点
 */
export function searchSync(
  keyword: string,
  nodes: Array<{ id: string; name: string; parentId: string | null }>
): SearchResult {
  if (!keyword || keyword.trim() === '') {
    return { matchIds: new Set(), expandIds: new Set() };
  }

  const lowerKeyword = keyword.toLowerCase().trim();
  const matchIds = new Set<string>();
  const expandIds = new Set<string>();

  // 构建 parentMap
  const parentMap = new Map(nodes.map((n) => [n.id, n.parentId]));

  // 搜索匹配
  for (const node of nodes) {
    if (node.name.toLowerCase().includes(lowerKeyword)) {
      matchIds.add(node.id);

      // 收集祖先
      let currentParentId = node.parentId;
      while (currentParentId !== null) {
        expandIds.add(currentParentId);
        currentParentId = parentMap.get(currentParentId) ?? null;
      }
    }
  }

  return { matchIds, expandIds };
}
