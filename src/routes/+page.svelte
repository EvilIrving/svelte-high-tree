<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { TreeManager, generateOrderedTestData } from '$lib/tree';
  import { SearchController } from '$lib/tree/search-controller';
  import VirtualTree from '$lib/components/VirtualTree.svelte';

  // 树管理器
  const treeManager = new TreeManager();

  // 搜索控制器
  let searchController: SearchController | null = null;

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
      debounceMs: 200,
      onResult: (result) => {
        treeManager.applySearchResult(result);
      }
    });
    searchController.init(rawNodes);

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
      {#if treeManager.searchMatchSet.size > 0}
        <span class="match-count">匹配: {treeManager.searchMatchSet.size} 个</span>
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
</style>
