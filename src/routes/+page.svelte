<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { TreeManager, generateOrderedTestData, createSearchConfig, SearchNavigator } from '$lib/tree';
  import { SearchController } from '$lib/tree/search-controller';
  import { expandMultiple } from '$lib/tree/visibility';
  import VirtualTree from '$lib/components/VirtualTree.svelte';

  // 树管理器
  const treeManager = new TreeManager();

  // 搜索配置
  const searchConfig = createSearchConfig({
    enableNavigation: true,
    enableLoop: true,
    showCount: true
  });

  // 搜索控制器
  let searchController: SearchController | null = null;

  // 搜索导航器
  const searchNavigator = new SearchNavigator(searchConfig);

  // 节点数量选项
  const nodeCounts = [1000, 5000, 10000, 30000, 50000];
  let selectedNodeCount = $state(10000);

  // 性能统计
  let initTime = $state(0);
  let lastActionTime = $state(0);

  // 搜索输入
  let searchInput = $state('');

  // 虚拟树组件引用
  let virtualTreeRef: VirtualTree;

  /**
   * 加载数据
   */
  function loadData(nodeCount: number): void {
    const startTime = performance.now();

    // 生成测试数据
    const rawNodes = generateOrderedTestData(nodeCount, 5, 15);

    // 初始化树
    treeManager.init(rawNodes);

    // 初始化搜索
    searchController?.destroy();
    searchController = new SearchController({
      debounceMs: searchConfig.debounceMs,
      onResult: (result) => {
        treeManager.applySearchResult(result);
        // 更新导航器并跳转到第一个匹配项
        const navResult = searchNavigator.updateMatches(result.matchIds);
        if (navResult.id) {
          treeManager.setExpandedSet(expandMultiple(navResult.expandIds, treeManager.expandedSet));
          // 延迟滚动，等待 DOM 更新
          requestAnimationFrame(() => {
            virtualTreeRef?.scrollToNode(navResult.id!);
          });
        }
      }
    });
    searchController.init(rawNodes);

    // 初始化导航器
    searchNavigator.init(treeManager.flatNodes, treeManager.index);

    initTime = Math.round(performance.now() - startTime);
    searchInput = '';
  }

  /**
   * 处理搜索
   */
  function handleSearch(e: Event): void {
    const keyword = (e.target as HTMLInputElement).value;
    searchInput = keyword;
    treeManager.searchKeyword = keyword;

    if (keyword.trim() === '') {
      treeManager.clearSearch();
    } else {
      searchController?.search(keyword);
    }
  }

  /**
   * 清除搜索
   */
  function clearSearch(): void {
    searchInput = '';
    treeManager.clearSearch();
    searchController?.clear();
    searchNavigator.reset();
  }

  /**
   * 下一个匹配项
   */
  function handleNextMatch(): void {
    const result = searchNavigator.next();
    if (result.id) {
      treeManager.setExpandedSet(expandMultiple(result.expandIds, treeManager.expandedSet));
      requestAnimationFrame(() => {
        virtualTreeRef?.scrollToNode(result.id!);
      });
    }
  }

  /**
   * 上一个匹配项
   */
  function handlePrevMatch(): void {
    const result = searchNavigator.prev();
    if (result.id) {
      treeManager.setExpandedSet(expandMultiple(result.expandIds, treeManager.expandedSet));
      requestAnimationFrame(() => {
        virtualTreeRef?.scrollToNode(result.id!);
      });
    }
  }

  /**
   * 展开到指定深度
   */
  function expandToDepth(depth: number): void {
    const startTime = performance.now();
    treeManager.expandToDepth(depth);
    lastActionTime = Math.round(performance.now() - startTime);
  }

  /**
   * 全部展开
   */
  function expandAll(): void {
    const startTime = performance.now();
    treeManager.expandAll();
    lastActionTime = Math.round(performance.now() - startTime);
  }

  /**
   * 全部收起
   */
  function collapseAll(): void {
    const startTime = performance.now();
    treeManager.collapseAll();
    lastActionTime = Math.round(performance.now() - startTime);
  }

  /**
   * 全选
   */
  function checkAll(): void {
    const startTime = performance.now();
    treeManager.checkAll();
    lastActionTime = Math.round(performance.now() - startTime);
  }

  /**
   * 全不选
   */
  function uncheckAll(): void {
    const startTime = performance.now();
    treeManager.uncheckAll();
    lastActionTime = Math.round(performance.now() - startTime);
  }

  /**
   * 切换展开
   */
  function handleToggleExpand(nodeId: string): void {
    const startTime = performance.now();
    treeManager.toggleExpand(nodeId);
    lastActionTime = Math.round(performance.now() - startTime);
  }

  /**
   * 切换勾选
   */
  function handleToggleCheck(nodeId: string): void {
    const startTime = performance.now();
    treeManager.toggleCheck(nodeId);
    lastActionTime = Math.round(performance.now() - startTime);
  }

  onMount(() => {
    loadData(selectedNodeCount);
  });

  onDestroy(() => {
    searchController?.destroy();
  });
</script>

<svelte:head>
  <title>High Performance Tree Component</title>
</svelte:head>

<div class="page-container">
  <header class="page-header">
    <h1>High Performance Tree Component</h1>
    <p class="subtitle">基于 Svelte 5 + IntersectionObserver + Web Worker 的高性能虚拟树</p>
  </header>

  <div class="controls-panel">
    <!-- 数据量选择 -->
    <div class="control-group">
      <label>节点数量：</label>
      <div class="button-group">
        {#each nodeCounts as count}
          <button
            class:active={selectedNodeCount === count}
            onclick={() => {
              selectedNodeCount = count;
              loadData(count);
            }}
          >
            {count.toLocaleString()}
          </button>
        {/each}
      </div>
    </div>

    <!-- 搜索 -->
    <div class="control-group">
      <label>搜索：</label>
      <div class="search-box">
        <input
          type="text"
          placeholder="输入关键词搜索..."
          value={searchInput}
          oninput={handleSearch}
        />
        {#if searchInput}
          <button class="clear-btn" onclick={clearSearch}>×</button>
        {/if}
      </div>
      {#if searchNavigator.hasMatches}
        <div class="search-nav">
          <button class="nav-btn" onclick={handlePrevMatch} title="上一个 (Shift+Enter)">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <span class="search-count">{searchNavigator.current}/{searchNavigator.total}</span>
          <button class="nav-btn" onclick={handleNextMatch} title="下一个 (Enter)">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
        </div>
      {/if}
    </div>

    <!-- 展开控制 -->
    <div class="control-group">
      <label>展开：</label>
      <div class="button-group">
        <button onclick={() => expandToDepth(1)}>一级</button>
        <button onclick={() => expandToDepth(2)}>二级</button>
        <button onclick={() => expandToDepth(3)}>三级</button>
        <button onclick={expandAll}>全部展开</button>
        <button onclick={collapseAll}>全部收起</button>
      </div>
    </div>

    <!-- 选中控制 -->
    <div class="control-group">
      <label>选中：</label>
      <div class="button-group">
        <button onclick={checkAll}>全选</button>
        <button onclick={uncheckAll}>全不选</button>
      </div>
      <span class="check-count">已选: {treeManager.checkedCount} 个</span>
    </div>
  </div>

  <!-- 统计信息 -->
  <div class="stats-bar">
    <span>总节点: <strong>{treeManager.totalNodeCount.toLocaleString()}</strong></span>
    <span>可见节点: <strong>{treeManager.visibleNodeCount.toLocaleString()}</strong></span>
    <span>已展开: <strong>{treeManager.expandedSet.size}</strong></span>
    <span>初始化耗时: <strong>{initTime}ms</strong></span>
    {#if lastActionTime > 0}
      <span>操作耗时: <strong>{lastActionTime}ms</strong></span>
    {/if}
  </div>

  <!-- 树容器 -->
  <div class="tree-container">
    {#if treeManager.isLoading}
      <div class="loading">加载中...</div>
    {:else}
      <VirtualTree
        bind:this={virtualTreeRef}
        visibleList={treeManager.visibleList}
        flatNodes={treeManager.flatNodes}
        expandedSet={treeManager.expandedSet}
        checkedSet={treeManager.checkedSet}
        searchMatchSet={treeManager.searchMatchSet}
        showCheckbox={false}
        currentMatchId={searchNavigator.currentId}
        index={treeManager.index}
        itemHeight={32}
        onToggleExpand={handleToggleExpand}
        onToggleCheck={handleToggleCheck}
      />
    {/if}
  </div>
</div>

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px;
    box-sizing: border-box;
  }

  .page-header {
    text-align: center;
    margin-bottom: 16px;
  }

  .page-header h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #333;
  }

  .subtitle {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .controls-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .control-group label {
    font-weight: 500;
    color: #333;
    white-space: nowrap;
  }

  .button-group {
    display: flex;
    gap: 4px;
  }

  .button-group button {
    padding: 6px 12px;
    border: 1px solid #d9d9d9;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }

  .button-group button:hover {
    border-color: #1890ff;
    color: #1890ff;
  }

  .button-group button.active {
    background: #1890ff;
    border-color: #1890ff;
    color: white;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-box input {
    padding: 6px 30px 6px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    width: 200px;
    font-size: 13px;
  }

  .search-box input:focus {
    outline: none;
    border-color: #1890ff;
  }

  .clear-btn {
    position: absolute;
    right: 4px;
    padding: 2px 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 16px;
    color: #999;
  }

  .clear-btn:hover {
    color: #333;
  }

  .match-count,
  .check-count {
    font-size: 13px;
    color: #1890ff;
  }

  .search-nav {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid #d9d9d9;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
  }

  .nav-btn:hover {
    border-color: #1890ff;
    color: #1890ff;
  }

  .nav-btn:active {
    background: #f0f0f0;
  }

  .search-count {
    font-size: 12px;
    color: #666;
    min-width: 40px;
    text-align: center;
  }

  .stats-bar {
    display: flex;
    gap: 24px;
    padding: 8px 16px;
    background: #fafafa;
    border-radius: 4px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #666;
  }

  .stats-bar strong {
    color: #333;
  }

  .tree-container {
    flex: 1;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    background: white;
    min-height: 400px;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #999;
  }

  /* ========== Headless Tree 自定义样式 ==========
   * treekit-svelte 组件不包含样式，完全由用户自定义
   *
   * 可用的 CSS 变量：
   * - --treekit-primary-color: 主色调
   * - --treekit-row-height: 行高
   * - --treekit-indent-width: 缩进宽度
   */

  /* 节点样式覆盖 */
  .page-container :global(.treekit-node) {
    --treekit-primary-color: #1890ff;
    --treekit-row-height: 32px;
    --treekit-indent-width: 20px;
    --treekit-bg-hover: #f5f5f5;
    --treekit-bg-match: #fffbe6;
    --treekit-bg-current: #bae7ff;
    --treekit-text-color: #333;
    --treekit-border-color: #f0f0f0;

    display: flex;
    align-items: center;
    gap: 4px;
    box-sizing: border-box;
    border-bottom: 1px solid var(--treekit-border-color);
    user-select: none;
    transition: background-color 0.15s;
    color: var(--treekit-text-color);
  }

  .page-container :global(.treekit-node:hover) {
    background-color: var(--treekit-bg-hover);
  }

  .page-container :global(.treekit-node[data-match="true"]) {
    background-color: var(--treekit-bg-match);
  }

  .page-container :global(.treekit-node[data-match="true"]:hover) {
    background-color: #fff1b8;
  }

  .page-container :global(.treekit-node[data-current="true"]) {
    background-color: var(--treekit-bg-current);
    box-shadow: inset 0 0 0 2px var(--treekit-primary-color);
  }

  .page-container :global(.treekit-node[data-current="true"]:hover) {
    background-color: #91d5ff;
  }

  /* 展开按钮样式 */
  .page-container :global(.treekit-expand) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  .page-container :global(.treekit-expand:hover:not(:disabled)) {
    background-color: rgba(0, 0, 0, 0.06);
  }

  .page-container :global(.treekit-expand:disabled) {
    cursor: default;
  }

  .page-container :global(.treekit-expand--expanded .treekit-expand-icon) {
    transform: rotate(90deg);
  }

  .page-container :global(.treekit-expand-icon) {
    transition: transform 0.2s;
    color: #666;
  }

  .page-container :global(.treekit-spacer) {
    width: 16px;
    height: 16px;
  }

  /* Checkbox 样式 */
  .page-container :global(.treekit-checkbox-wrapper) {
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .page-container :global(.treekit-checkbox-input) {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .page-container :global(.treekit-checkbox-visual) {
    width: 16px;
    height: 16px;
    border: 2px solid #666;
    border-radius: 3px;
    background: white;
    position: relative;
    transition: all 0.15s;
  }

  .page-container :global(.treekit-checkbox-visual--checked) {
    background: var(--treekit-primary-color);
    border-color: var(--treekit-primary-color);
  }

  .page-container :global(.treekit-checkbox-visual--checked::after) {
    content: '';
    position: absolute;
    left: 4px;
    top: 1px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .page-container :global(.treekit-checkbox-visual--indeterminate) {
    background: var(--treekit-primary-color);
    border-color: var(--treekit-primary-color);
  }

  .page-container :global(.treekit-checkbox-visual--indeterminate::after) {
    content: '';
    position: absolute;
    left: 2px;
    top: 5px;
    width: 8px;
    height: 2px;
    background: white;
  }

  /* 节点名称样式 */
  .page-container :global(.treekit-label) {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }

  /* 虚拟树容器样式 */
  .page-container :global(.treekit-virtual) {
    height: 100%;
    overflow: auto;
    position: relative;
  }

  .page-container :global(.treekit-virtual-spacer) {
    position: relative;
    min-height: 100%;
  }

  .page-container :global(.treekit-virtual-viewport) {
    position: absolute;
    width: 100%;
    left: 0;
  }

  .page-container :global(.treekit-virtual-sentinel) {
    position: absolute;
    height: 1px;
    width: 100%;
    pointer-events: none;
  }
</style>
