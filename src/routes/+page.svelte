<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Tree,
    TreeNodeView,
    type RawNode,
    type TreeNode
  } from '@light-cat/treekit-svelte';

  // ============ 测试数据 ============

  // 基础树数据
  const basicData: RawNode[] = [
    { id: '1', name: '根节点 1', parentId: null },
    { id: '1-1', name: '子节点 1-1', parentId: '1' },
    { id: '1-1-1', name: '子节点 1-1-1', parentId: '1-1' },
    { id: '1-1-2', name: '子节点 1-1-2', parentId: '1-1' },
    { id: '1-2', name: '子节点 1-2', parentId: '1' },
    { id: '2', name: '根节点 2', parentId: null },
    { id: '2-1', name: '子节点 2-1', parentId: '2' },
    { id: '2-2', name: '子节点 2-2', parentId: '2' },
    { id: '3', name: '根节点 3', parentId: null }
  ];

  // 大数据测试数据
  function generateLargeData(nodeCount: number, branchingFactor: number = 3): RawNode[] {
    const nodes: RawNode[] = [];
    let currentId = 0;

    function generate(parentId: string | null, depth: number): void {
      if (currentId >= nodeCount) return;
      const id = String(currentId++);
      nodes.push({ id, name: `节点 ${id.padStart(4, '0')}`, parentId });

      if (depth < 5) {
        for (let i = 0; i < branchingFactor && currentId < nodeCount; i++) {
          generate(id, depth + 1);
        }
      }
    }

    while (currentId < nodeCount) {
      generate(null, 0);
    }

    return nodes;
  }

  // 带图标的数据
  const iconData: RawNode[] = [
    { id: 'docs', name: '文档', parentId: null },
    { id: 'docs-api', name: 'API 文档', parentId: 'docs' },
    { id: 'docs-guide', name: '使用指南', parentId: 'docs' },
    { id: 'docs-faq', name: '常见问题', parentId: 'docs' },
    { id: 'src', name: '源代码', parentId: null },
    { id: 'src-core', name: '核心模块', parentId: 'src' },
    { id: 'src-utils', name: '工具函数', parentId: 'src' },
    { id: 'src-components', name: '组件', parentId: 'src' },
    { id: 'tests', name: '测试', parentId: null },
    { id: 'config', name: '配置文件', parentId: null }
  ];

  // 自定义字段数据
  interface CustomNode {
    nodeId: string;
    nodeLabel: string;
    parentNodeId: string | null;
    nodeType: string;
    nodeIcon?: string;
  }

  const customFieldData: CustomNode[] = [
    { nodeId: '1', nodeLabel: '用户管理', parentNodeId: null, nodeType: 'folder' },
    { nodeId: '1-1', nodeLabel: '用户列表', parentNodeId: '1', nodeType: 'page' },
    { nodeId: '1-2', nodeLabel: '角色管理', parentNodeId: '1', nodeType: 'page' },
    { nodeId: '2', nodeLabel: '系统设置', parentNodeId: null, nodeType: 'folder' },
    { nodeId: '2-1', nodeLabel: '基本设置', parentNodeId: '2', nodeType: 'page' },
    { nodeId: '2-2', nodeLabel: '安全设置', parentNodeId: '2', nodeType: 'page' }
  ];

  // ============ Demo 状态 ============

  // 当前选中的 demo
  let currentDemo = $state(0);
  const demos = ['基础用法', '复选框', '搜索功能', '大数据', '自定义字段', '完全自定义'];

  // Demo 1: 基础树
  let basicTreeRef: Tree;

  // Demo 2: 复选框树
  let checkboxTreeRef: Tree;
  let checkedKeys = $state<string[]>([]);
  let checkStrictly = $state(false);

  // Demo 3: 搜索树
  let searchTreeRef: Tree;
  let searchKeyword = $state('');
  let searchResults = $state({ current: 0, total: 0 });

  // Demo 4: 大数据树
  let largeTreeRef: Tree;
  let largeData = $state<RawNode[]>([]);
  let largeDataCount = $state(10000);

  // Demo 5: 自定义字段树
  let customTreeRef: Tree;

  // Demo 6: 完全自定义节点
  let customNodeTreeRef: Tree;
  let selectedCustomNode = $state<TreeNode | null>(null);

  // ============ 事件处理 ============

  function handleBasicExpand(expandedKeys: string[]) {
    console.log('展开的节点:', expandedKeys);
  }

  function handleBasicSelect(selectedKeys: string[], info: { node: TreeNode }) {
    console.log('选中的节点:', info.node);
  }

  function handleCheck(checked: string[], info: { node: TreeNode; checked: boolean }) {
    checkedKeys = checked;
    console.log('勾选变更:', info.node.name, info.checked);
  }

  function handleSearchInput(e: Event) {
    const keyword = (e.target as HTMLInputElement).value;
    searchKeyword = keyword;
    searchTreeRef?.search(keyword);
    updateSearchState();
  }

  function clearSearch() {
    searchKeyword = '';
    searchTreeRef?.clearSearch();
    updateSearchState();
  }

  function updateSearchState() {
    const state = searchTreeRef?.getSearchState();
    if (state) {
      searchResults = { current: state.current, total: state.total };
    }
  }

  function nextMatch() {
    searchTreeRef?.nextMatch();
    updateSearchState();
  }

  function prevMatch() {
    searchTreeRef?.prevMatch();
    updateSearchState();
  }

  function loadLargeData() {
    largeData = generateLargeData(largeDataCount, 5);
  }

  function handleCustomSelect(selectedKeys: string[], info: { node: TreeNode }) {
    selectedCustomNode = info.node;
  }

  onMount(() => {
    loadLargeData();
  });
</script>

<svelte:head>
  <title>treekit-svelte Demo - 高性能树组件</title>
</svelte:head>

<div class="page-container">
  <header class="page-header">
    <h1>treekit-svelte Demo</h1>
    <p class="subtitle">Svelte 5 高性能虚拟树组件 - 多种用法示例</p>
  </header>

  <!-- Demo 切换标签 -->
  <nav class="demo-tabs">
    {#each demos as demo, index}
      <button
        class="tab-btn"
        class:active={currentDemo === index}
        onclick={() => currentDemo = index}
      >
        {demo}
      </button>
    {/each}
  </nav>

  <!-- Demo 内容区域 -->
  <main class="demo-content">
    {#if currentDemo === 0}
      <!-- ============ Demo 1: 基础用法 ============ -->
      <section class="demo-section">
        <h2>基础树形结构</h2>
        <p class="demo-desc">最简单的树组件用法，只需传入数据即可。</p>

        <div class="demo-code">
          <pre><code>{`<script>
  import { Tree } from '@light-cat/treekit-svelte';

  const treeData = [
    { id: '1', name: '根节点', parentId: null },
    { id: '1-1', name: '子节点', parentId: '1' },
    // ...
  ];
</script>

<Tree
  {treeData}
  onExpand={handleExpand}
  onSelect={handleSelect}
/>`}</code></pre>
        </div>

        <div class="demo-preview">
          <div class="tree-wrapper">
            <Tree
              bind:this={basicTreeRef}
              treeData={basicData}
              onExpand={handleBasicExpand}
              onSelect={handleBasicSelect}
            />
          </div>
        </div>

        <div class="demo-actions">
          <button onclick={() => basicTreeRef?.expandAll()}>全部展开</button>
          <button onclick={() => basicTreeRef?.collapseAll()}>全部收起</button>
          <button onclick={() => basicTreeRef?.scrollToNode('1-1-1')}>滚动到深层节点</button>
        </div>
      </section>

    {:else if currentDemo === 1}
      <!-- ============ Demo 2: 复选框 ============ -->
      <section class="demo-section">
        <h2>复选框模式</h2>
        <p class="demo-desc">支持父子节点级联选择，可配置联动或独立模式。</p>

        <div class="demo-code">
          <pre><code>{`<Tree
  {treeData}
  checkable={true}
  checkStrictly={false}  // true: 父子不联动
  onCheck={handleCheck}
/>`}</code></pre>
        </div>

        <div class="demo-options">
          <label class="option-item">
            <input type="checkbox" bind:checked={checkStrictly} />
            <span>父子不联动 (checkStrictly)</span>
          </label>
        </div>

        <div class="demo-preview">
          <div class="tree-wrapper">
            <Tree
              bind:this={checkboxTreeRef}
              treeData={basicData}
              checkable={true}
              checkStrictly={checkStrictly}
              onCheck={handleCheck}
            />
          </div>
        </div>

        <div class="demo-actions">
          <button onclick={() => checkboxTreeRef?.checkAll()}>全选</button>
          <button onclick={() => checkboxTreeRef?.uncheckAll()}>全不选</button>
          <span class="info">已选: {checkedKeys.length} 个</span>
        </div>
      </section>

    {:else if currentDemo === 2}
      <!-- ============ Demo 3: 搜索功能 ============ -->
      <section class="demo-section">
        <h2>搜索与高亮</h2>
        <p class="demo-desc">支持关键词搜索、结果高亮和导航切换。</p>

        <div class="demo-code">
          <pre><code>{`<Tree
  {treeData}
  searchable={true}
  onExpand={handleExpand}
/>

<!-- 通过 ref 调用搜索方法 -->
treeRef.search('关键词');
treeRef.nextMatch();
treeRef.prevMatch();`}</code></pre>
        </div>

        <div class="demo-preview">
          <div class="search-bar">
            <input
              type="text"
              placeholder="输入关键词搜索..."
              value={searchKeyword}
              oninput={handleSearchInput}
            />
            {#if searchKeyword}
              <button class="clear-btn" onclick={clearSearch}>×</button>
            {/if}
            {#if searchResults.total > 0}
              <div class="search-nav">
                <button onclick={prevMatch}>&lt;</button>
                <span>{searchResults.current}/{searchResults.total}</span>
                <button onclick={nextMatch}>&gt;</button>
              </div>
            {/if}
          </div>

          <div class="tree-wrapper">
            <Tree
              bind:this={searchTreeRef}
              treeData={iconData}
              searchable={true}
            />
          </div>
        </div>
      </section>

    {:else if currentDemo === 3}
      <!-- ============ Demo 4: 大数据 ============ -->
      <section class="demo-section">
        <h2>大数据虚拟滚动</h2>
        <p class="demo-desc">基于 IntersectionObserver 的虚拟滚动，轻松渲染 5w+ 节点。</p>

        <div class="demo-code">
          <pre><code>{`<Tree
  {treeData}
  itemHeight={32}  // 可选，默认 32px
/>`}</code></pre>
        </div>

        <div class="demo-options">
          <label class="option-item">
            <span>节点数量:</span>
            <select bind:value={largeDataCount} onchange={loadLargeData}>
              <option value={1000}>1,000</option>
              <option value={5000}>5,000</option>
              <option value={10000}>10,000</option>
              <option value={30000}>30,000</option>
              <option value={50000}>50,000</option>
            </select>
          </label>
        </div>

        <div class="demo-preview">
          <div class="tree-wrapper large">
            <Tree
              bind:this={largeTreeRef}
              treeData={largeData}
              checkable={true}
            />
          </div>
        </div>

        <div class="demo-actions">
          <button onclick={() => largeTreeRef?.expandAll()}>全部展开</button>
          <button onclick={() => largeTreeRef?.collapseAll()}>全部收起</button>
          <button onclick={() => largeTreeRef?.expandToDepth(2)}>展开到二级</button>
        </div>
      </section>

    {:else if currentDemo === 4}
      <!-- ============ Demo 5: 自定义字段映射 ============ -->
      <section class="demo-section">
        <h2>自定义字段映射</h2>
        <p class="demo-desc">通过 fieldMapper 适配不同数据格式，无需转换数据结构。</p>

        <div class="demo-code">
          <pre><code>{`<script>
  // 数据字段名不同
  const data = [
    { nodeId: '1', nodeLabel: '用户管理', parentNodeId: null },
    // ...
  ];
</script>

<Tree
  {treeData}
  fieldMapper={{
    id: 'nodeId',
    name: 'nodeLabel',
    parentId: 'parentNodeId'
  }}
/>`}</code></pre>
        </div>

        <div class="demo-preview">
          <div class="tree-wrapper">
            <Tree
              bind:this={customTreeRef}
              treeData={customFieldData}
              fieldMapper={{
                id: 'nodeId',
                name: 'nodeLabel',
                parentId: 'parentNodeId'
              }}
              checkable={true}
            />
          </div>
        </div>
      </section>

    {:else if currentDemo === 5}
      <!-- ============ Demo 6: 完全自定义节点 ============ -->
      <section class="demo-section">
        <h2>完全自定义节点样式</h2>
        <p class="demo-desc">通过 CSS 变量和全局样式完全自定义树组件外观（Headless 模式）。</p>

        <div class="demo-code">
          <pre><code>{`<!-- 在父组件中通过 CSS 定制样式 -->
<style>
  :global(.treekit-node) {
    --treekit-primary-color: #52c41a;  /* 主色调 */
    --treekit-row-height: 40px;        /* 行高 */
    --treekit-bg-hover: #f6ffed;       /* hover 背景 */
    --treekit-bg-selected: #d9f7be;    /* 选中背景 */
  }
</style>`}</code></pre>
        </div>

        <div class="demo-preview">
          <div class="selected-info">
            <span>当前选中:</span>
            <strong>{selectedCustomNode?.name ?? '无'}</strong>
          </div>

          <div class="tree-wrapper">
            <Tree
              bind:this={customNodeTreeRef}
              treeData={iconData}
              checkable={true}
              selectable={true}
              onSelect={handleCustomSelect}
            />
          </div>
        </div>

        <div class="demo-actions">
          <button onclick={() => customNodeTreeRef?.scrollToNode('docs')}>滚动到"文档"</button>
          <button onclick={() => customNodeTreeRef?.expandToDepth(2)}>展开到二级</button>
          <button onclick={() => console.log('单选选中:', customNodeTreeRef?.getSelectedKey())}>获取单选选中</button>
          <button onclick={() => console.log('复选框选中:', customNodeTreeRef?.getCheckedKeys())}>获取复选框选中</button>
        </div>
      </section>
    {/if}
  </main>

  <footer class="page-footer">
    <p>基于 Svelte 5 + 虚拟滚动 + Web Worker 搜索</p>
  </footer>
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

  /* 标签切换 */
  .demo-tabs {
    display: flex;
    gap: 4px;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 16px;
    overflow-x: auto;
  }

  .tab-btn {
    padding: 8px 16px;
    border: none;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    background: #e8e8e8;
  }

  .tab-btn.active {
    background: #1890ff;
    color: white;
  }

  /* Demo 内容 */
  .demo-content {
    flex: 1;
    overflow: auto;
  }

  .demo-section {
    background: white;
    border-radius: 8px;
    padding: 20px;
  }

  .demo-section h2 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: #333;
  }

  .demo-desc {
    margin: 0 0 16px 0;
    color: #666;
    font-size: 14px;
  }

  .demo-code {
    background: #1e1e1e;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    overflow-x: auto;
  }

  .demo-code code {
    color: #d4d4d4;
    font-family: 'SF Mono', Consolas, monospace;
    font-size: 13px;
    line-height: 1.5;
  }

  .demo-options {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #666;
    cursor: pointer;
  }

  .demo-preview {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #fafafa;
    border-bottom: 1px solid #e0e0e0;
  }

  .search-bar input {
    flex: 1;
    max-width: 300px;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-size: 14px;
  }

  .search-bar input:focus {
    outline: none;
    border-color: #1890ff;
  }

  .clear-btn {
    margin-left: -32px;
    padding: 4px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    color: #999;
  }

  .clear-btn:hover {
    color: #333;
  }

  .search-nav {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .search-nav button {
    width: 28px;
    height: 28px;
    border: 1px solid #d9d9d9;
    background: white;
    border-radius: 4px;
    cursor: pointer;
  }

  .search-nav span {
    min-width: 60px;
    text-align: center;
    font-size: 13px;
    color: #666;
  }

  .tree-wrapper {
    height: 400px;
  }

  .tree-wrapper.large {
    height: 500px;
  }

  .demo-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }

  .demo-actions button {
    padding: 8px 16px;
    border: 1px solid #d9d9d9;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }

  .demo-actions button:hover {
    border-color: #1890ff;
    color: #1890ff;
  }

  .info {
    font-size: 13px;
    color: #1890ff;
    padding: 8px 0;
  }

  .selected-info {
    padding: 12px 16px;
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
    font-size: 14px;
  }

  .selected-info strong {
    color: #1890ff;
    margin-left: 8px;
  }

  .page-footer {
    text-align: center;
    padding: 16px;
    color: #999;
    font-size: 12px;
  }

  /* ============ 树组件样式 ============ */
  :global(.treekit-node) {
    --treekit-primary-color: #1890ff;
    --treekit-row-height: 32px;
    --treekit-indent-width: 20px;
    --treekit-bg-hover: #f5f5f5;
    --treekit-bg-match: #fffbe6;
    --treekit-bg-current: #bae7ff;
    --treekit-bg-selected: #e6f7ff;
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
    cursor: default;
  }

  :global(.treekit-node:hover) {
    background-color: var(--treekit-bg-hover);
  }

  :global(.treekit-node[data-match="true"]) {
    background-color: var(--treekit-bg-match);
  }

  :global(.treekit-node[data-current="true"]) {
    background-color: var(--treekit-bg-current);
    box-shadow: inset 0 0 0 2px var(--treekit-primary-color);
  }

  :global(.treekit-node[data-selected="true"]) {
    background-color: var(--treekit-bg-selected);
    color: var(--treekit-primary-color);
  }

  :global(.treekit-expand) {
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

  :global(.treekit-expand:hover:not(:disabled)) {
    background-color: rgba(0, 0, 0, 0.06);
  }

  :global(.treekit-expand:disabled) {
    cursor: default;
  }

  :global(.treekit-expand--expanded .treekit-expand-icon) {
    transform: rotate(90deg);
  }

  :global(.treekit-expand-icon) {
    transition: transform 0.2s;
    color: #666;
  }

  :global(.treekit-spacer) {
    width: 16px;
    height: 16px;
  }

  :global(.treekit-checkbox-wrapper) {
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  :global(.treekit-checkbox-input) {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  :global(.treekit-checkbox-visual) {
    width: 16px;
    height: 16px;
    border: 2px solid #666;
    border-radius: 3px;
    background: white;
    position: relative;
    transition: all 0.15s;
  }

  :global(.treekit-checkbox-visual--checked) {
    background: var(--treekit-primary-color);
    border-color: var(--treekit-primary-color);
  }

  :global(.treekit-checkbox-visual--checked::after) {
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

  :global(.treekit-checkbox-visual--indeterminate) {
    background: var(--treekit-primary-color);
    border-color: var(--treekit-primary-color);
  }

  :global(.treekit-checkbox-visual--indeterminate::after) {
    content: '';
    position: absolute;
    left: 2px;
    top: 5px;
    width: 8px;
    height: 2px;
    background: white;
  }

  :global(.treekit-label) {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }

  :global(.treekit-virtual-list) {
    height: 100%;
    overflow: auto;
    position: relative;
  }

  :global(.treekit-virtual-spacer) {
    position: relative;
    min-height: 100%;
  }

  :global(.treekit-virtual-viewport) {
    position: absolute;
    width: 100%;
    left: 0;
  }

  :global(.treekit-virtual-sentinel) {
    position: absolute;
    height: 1px;
    width: 100%;
    pointer-events: none;
  }
</style>
