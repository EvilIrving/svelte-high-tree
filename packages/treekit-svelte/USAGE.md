# 使用指南

本指南详细介绍 treekit-svelte 的各种使用场景和最佳实践。

## 目录

- [基础用法](#基础用法)
- [复选框功能](#复选框功能)
- [搜索功能](#搜索功能)
- [虚拟滚动](#虚拟滚动)
- [事件处理](#事件处理)
- [组件方法](#组件方法)
- [样式定制](#样式定制)
- [自定义节点渲染](#自定义节点渲染)
- [复杂场景](#复杂场景)

---

## 基础用法

### 简单树

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  const treeData = [
    { id: '1', name: '中国', parentId: null },
    { id: '1-1', name: '北京', parentId: '1' },
    { id: '1-2', name: '上海', parentId: '1' },
    { id: '1-3', name: '广东', parentId: '1' },
    { id: '1-3-1', name: '深圳', parentId: '1-3' },
    { id: '1-3-2', name: '广州', parentId: '1-3' },
  ];
</script>

<Tree {treeData} />
```

### 绑定组件实例

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let treeRef: Tree;
  let treeData = [...];

  function handleExpandAll() {
    treeRef?.expandAll();
  }

  function handleCollapseAll() {
    treeRef?.collapseAll();
  }

  function handleScrollToNode() {
    treeRef?.scrollToNode('1-3-1');
  }
</script>

<Tree bind:this={treeRef} {treeData} />

<button onclick={handleExpandAll}>展开全部</button>
<button onclick={handleCollapseAll}>折叠全部</button>
<button onclick={handleScrollToNode}>滚动到深圳</button>
```

### 初始展开/选中

```svelte
<Tree
  {treeData}
  defaultExpandedKeys={['1', '1-3']}
  defaultSelectedKeys={['1-3-1']}
/>
```

---

## 复选框功能

### 启用复选框

```svelte
<Tree
  {treeData}
  checkable
/>
```

### 获取勾选结果

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let treeRef: Tree;

  function handleSubmit() {
    // 获取所有勾选的节点 ID
    const checkedKeys = treeRef?.getCheckedKeys() ?? [];
    console.log('勾选的节点:', checkedKeys);

    // 获取勾选的叶子节点 ID（常用于表单提交）
    const leafKeys = treeRef?.getCheckedLeafKeys() ?? [];
    console.log('叶子节点:', leafKeys);
  }
</script>

<Tree bind:this={treeRef} {treeData} checkable />

<button onclick={handleSubmit}>提交</button>
```

### 默认勾选

```svelte
<Tree
  {treeData}
  checkable
  defaultCheckedKeys={['1-1', '1-2-1']}
/>
```

### 严格模式（父子不联动）

```svelte
<Tree
  {treeData}
  checkable
  checkStrictly
/>
```

### 全选/取消全选

```svelte
<script lang="ts">
  let treeRef: Tree;

  function checkAll() {
    treeRef?.checkAll();
  }

  function uncheckAll() {
    treeRef?.uncheckAll();
  }
</script>

<Tree bind:this={treeRef} {treeData} checkable />

<button onclick={checkAll}>全选</button>
<button onclick={uncheckAll}>取消全选</button>
```

### 监听勾选变化

```svelte
<Tree
  {treeData}
  checkable
  onCheck={(keys, info) => {
    console.log('所有勾选的节点:', keys);
    console.log('操作的节点:', info.node);
    console.log('勾选状态:', info.checked);
  }}
/>
```

---

## 搜索功能

### 启用搜索

```svelte
<Tree
  {treeData}
  searchable
/>
```

### 搜索 API

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let treeRef: Tree;
  let searchKeyword = $state('');
  let searchState = $state({ hasMatches: false, current: 0, total: 0 });

  function handleSearch() {
    treeRef?.search(searchKeyword);
    searchState = treeRef?.getSearchState() ?? searchState;
  }

  function clearSearch() {
    searchKeyword = '';
    treeRef?.clearSearch();
    searchState = { hasMatches: false, current: 0, total: 0 };
  }

  function nextMatch() {
    treeRef?.nextMatch();
    searchState = treeRef?.getSearchState() ?? searchState;
  }

  function prevMatch() {
    treeRef?.prevMatch();
    searchState = treeRef?.getSearchState() ?? searchState;
  }
</script>

<input
  type="text"
  bind:value={searchKeyword}
  onkeydown={(e) => e.key === 'Enter' && handleSearch()}
  placeholder="搜索节点名称"
/>

<button onclick={handleSearch}>搜索</button>
<button onclick={clearSearch}>清除</button>

{#if searchState.hasMatches}
  <span>
    {searchState.current} / {searchState.total}
  </span>
  <button onclick={nextMatch}>下一个</button>
  <button onclick={prevMatch}>上一个</button>
{/if}

<Tree bind:this={treeRef} {treeData} searchable />
```

### 搜索状态

```typescript
interface SearchState {
  hasMatches: boolean;  // 是否有匹配
  current: number;      // 当前匹配项索引（从 1 开始）
  total: number;        // 匹配总数
  currentId: string;    // 当前匹配项的节点 ID
}
```

### 搜索高亮样式

```css
/* 匹配节点高亮 */
.treekit-tree-node.match {
  background-color: #fef08a;
}

/* 当前导航到的匹配项 */
.treekit-tree-node.current-match {
  background-color: #facc15;
  outline: 2px solid #eab308;
}
```

---

## 虚拟滚动

### 默认行为

默认启用虚拟滚动，自动处理大数据量渲染。

### 自定义行高

```svelte
<Tree
  {treeData}
  itemHeight={40}
/>
```

### 虚拟列表组件

如果需要独立的虚拟列表组件：

```svelte
<script lang="ts">
  import { VirtualList } from '@light-cat/treekit-svelte';

  let items = $state([...]);
  let containerHeight = 400;
  let itemHeight = 32;
</script>

<VirtualList
  {items}
  {itemHeight}
  {containerHeight}
  let:item
  let:index
>
  <div class="item" style="height: {itemHeight}px;">
    {index}: {item.name}
  </div>
</VirtualList>
```

### VirtualTree 底层组件

完全自定义树组件时使用：

```svelte
<script lang="ts">
  import { VirtualTree } from '@light-cat/treekit-svelte';
  import { createTree } from '@light-cat/treekit-svelte';

  let { treeData } = $props();

  // 使用 createTree 创建响应式树状态
  const tree = createTree(treeData, { checkable: true });
</script>

<VirtualTree
  visibleList={tree.visibleList}
  flatNodes={tree.flatNodes}
  expandedSet={tree.expandedSet}
  checkedSet={tree.checkedSet}
  matchSet={tree.matchSet}
  selectedId={tree.selectedId}
  index={tree.index}
  itemHeight={32}
  showCheckbox
  onToggleExpand={(id) => {
    const node = tree.index.nodeMap.get(id);
    if (node) {
      const index = tree.flatNodes.findIndex(n => n.id === id);
      tree.toggle(index);
    }
  }}
  onToggleCheck={(id) => {
    tree.toggleCheckById(id);
  }}
  onNodeClick={(id) => {
    tree.select(id);
  }}
/>
```

---

## 事件处理

### 勾选事件

```svelte
<Tree
  {treeData}
  checkable
  onCheck={(checkedKeys, info) => {
    console.log('已勾选的节点 ID:', checkedKeys);
    console.log('操作的节点:', info.node);
    console.log('勾选状态:', info.checked);
  }}
/>
```

### 选中事件

```svelte
<Tree
  {treeData}
  selectable
  onSelect={(selectedKeys, info) => {
    console.log('当前选中的节点 ID:', selectedKeys);
    console.log('操作的节点:', info.node);
    console.log('选中状态:', info.selected);
  }}
/>
```

### 展开事件

```svelte
<Tree
  {treeData}
  onExpand={(expandedKeys, info) => {
    console.log('已展开的节点 ID:', expandedKeys);
    console.log('操作的节点:', info.node);
    console.log('展开状态:', info.expanded);
  }}
/>
```

### 禁用节点选择

```svelte
<!-- 禁用节点选择功能 -->
<Tree {treeData} selectable={false} />

<!-- 禁用点击但保留复选框 -->
<Tree {treeData} selectable={false} checkable />
```

---

## 组件方法

### 展开/折叠

```typescript
// 展开所有节点
treeRef?.expandAll();

// 折叠所有节点
treeRef?.collapseAll();

// 展开到指定深度
treeRef?.expandToDepth(2);

// 滚动到指定节点
treeRef?.scrollToNode('1-3-1');
```

### 复选框

```typescript
// 全选
treeRef?.checkAll();

// 取消全选
treeRef?.uncheckAll();

// 获取所有勾选的节点 ID
const checkedKeys = treeRef?.getCheckedKeys();

// 获取勾选的叶子节点 ID
const leafKeys = treeRef?.getCheckedLeafKeys();

// 获取当前选中的节点 ID
const selectedKey = treeRef?.getSelectedKey();
```

### 搜索

```typescript
// 执行搜索
treeRef?.search('关键词');

// 清除搜索
treeRef?.clearSearch();

// 下一个匹配项
treeRef?.nextMatch();

// 上一个匹配项
treeRef?.prevMatch();

// 获取搜索状态
const state = treeRef?.getSearchState();
```

### 状态统计

```typescript
const stats = treeRef?.getStats();
console.log({
  totalCount: stats?.totalCount,      // 节点总数
  visibleCount: stats?.visibleCount,  // 可见节点数
  checkedCount: stats?.checkedCount,  // 勾选节点数
  expandedCount: stats?.expandedCount // 展开节点数
});
```

---

## 样式定制

### CSS 变量

```css
/* 容器 */
.treekit-tree {
  --treekit-bg: #ffffff;
  --treekit-border: #e5e7eb;
  --treekit-height: 400px;
  --treekit-width: 100%;
}

/* 节点 */
.treekit-tree-node {
  --treekit-node-height: 32px;
  --treekit-node-padding: 8px 12px;
  --treekit-hover-bg: #f3f4f6;
  --treekit-selected-bg: #e0f2fe;
  --treekit-match-bg: #fef08a;
}

/* 缩进 */
.treekit-tree-indent {
  --treekit-indent-width: 20px;
}

/* 展开图标 */
.treekit-tree-switcher {
  --treekit-switcher-size: 16px;
  --treekit-switcher-color: #6b7280;
  --treekit-switcher-hover-color: #374151;
  --treekit-switcher-expanded-color: #3b82f6;
}

/* 复选框 */
.treekit-tree-checkbox {
  --treekit-checkbox-size: 16px;
  --treekit-checkbox-color: #d1d5db;
  --treekit-checkbox-checked: #3b82f6;
  --treekit-checkbox-indeterminate: #93c5fd;
}

/* 节点名称 */
.treekit-tree-name {
  --treekit-name-color: #374151;
  --treekit-name-hover-color: #111827;
  --treekit-name-selected-color: #0ea5e9;
}
```

### 自定义样式类

```svelte
<Tree
  {treeData}
  class="my-custom-tree"
/>

<style>
  :global(.my-custom-tree) {
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  :global(.my-custom-tree .treekit-tree-node) {
    border-bottom: 1px solid #f3f4f6;
  }

  :global(.my-custom-tree .treekit-tree-node:hover) {
    background-color: #f9fafb;
  }
</style>
```

### 图标自定义

```css
/* 展开/折叠图标 */
.treekit-tree-switcher::before {
  content: '▶';
  font-size: 12px;
}

.treekit-tree-switcher.expanded::before {
  content: '▼';
}

/* 或使用 SVG 图标 */
.treekit-tree-switcher {
  background: url('/icons/arrow-right.svg') center no-repeat;
}

.treekit-tree-switcher.expanded {
  background: url('/icons/arrow-down.svg') center no-repeat;
}
```

---

## 自定义节点渲染

### 使用 createTree 自定义渲染

```svelte
<script lang="ts">
  import { VirtualTree, createTree } from '@light-cat/treekit-svelte';

  let { treeData } = $props();

  const tree = createTree(treeData, {
    checkable: true,
    fieldMapper: { id: 'id', parentId: 'pid', name: 'title' }
  });
</script>

<div class="custom-tree">
  <VirtualTree
    visibleList={tree.visibleList}
    flatNodes={tree.flatNodes}
    expandedSet={tree.expandedSet}
    checkedSet={tree.checkedSet}
    matchSet={tree.matchSet}
    selectedId={tree.selectedId}
    index={tree.index}
    itemHeight={40}
    showCheckbox
    onToggleExpand={(id) => {
      const idx = tree.flatNodes.findIndex(n => n.id === id);
      tree.toggle(idx);
    }}
    onToggleCheck={(id) => {
      tree.toggleCheckById(id);
    }}
    onNodeClick={(id) => {
      tree.select(id);
    }}
  >
    {#snippet nodeContent(node, status)}
      <div class="custom-node" class:selected={status.isChecked}>
        <!-- 展开图标 -->
        {#if node.hasChildren}
          <span
            class="switcher"
            class:expanded={status.isExpanded}
            onclick={() => {
              const idx = tree.flatNodes.findIndex(n => n.id === node.id);
              tree.toggle(idx);
            }}
          >
            ▶
          </span>
        {:else}
          <span class="spacer" />
        {/if}

        <!-- 复选框 -->
        {#if status.isIndeterminate}
          <input type="checkbox" indeterminate />
        {:else}
          <input
            type="checkbox"
            checked={status.isChecked}
            onclick={(e) => {
              e.stopPropagation();
              tree.toggleCheckById(node.id);
            }}
          />
        {/if}

        <!-- 节点图标 -->
        {#if node.type === 'folder'}
          <span class="icon folder">📁</span>
        {:else}
          <span class="icon file">📄</span>
        {/if}

        <!-- 节点名称 -->
        <span class="name">{node.name}</span>
      </div>
    {/snippet}
  </VirtualTree>
</div>

<style>
  .custom-node {
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 12px;
    gap: 8px;
  }

  .switcher {
    width: 16px;
    cursor: pointer;
    transition: transform 0.15s;
  }

  .switcher.expanded {
    transform: rotate(90deg);
  }

  .spacer {
    width: 16px;
  }

  .icon {
    font-size: 14px;
  }

  .name {
    flex: 1;
  }
</style>
```

### 带图标的树

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  interface TreeNodeData {
    id: string;
    name: string;
    parentId: string | null;
    type?: 'folder' | 'file' | 'image';
  }

  let treeData: TreeNodeData[] = [
    { id: '1', name: '文档', parentId: null, type: 'folder' },
    { id: '1-1', name: '技术文档', parentId: '1', type: 'file' },
    { id: '1-2', name: '图片', parentId: '1', type: 'folder' },
    { id: '1-2-1', name: '头像.png', parentId: '1-2', type: 'image' },
  ];

  function getNodeIcon(type?: string) {
    switch (type) {
      case 'folder': return '📁';
      case 'image': return '🖼️';
      default: return '📄';
    }
  }
</script>

<Tree {treeData} onRenderNode={(node) => getNodeIcon(node.type)} />
```

---

## 复杂场景

### 动态数据更新

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let treeData = $state([
    { id: '1', name: '根节点', parentId: null },
  ]);

  function addNode(parentId: string) {
    const newId = `${parentId}-${Date.now()}`;
    treeData = [...treeData, {
      id: newId,
      name: `新节点 ${newId.slice(-4)}`,
      parentId
    }];
  }

  function removeNode(nodeId: string) {
    // 移除节点及其所有子节点
    const idsToRemove = new Set<string>([nodeId]);

    // 收集所有子节点 ID
    function collectChildren(id: string) {
      treeData.forEach(node => {
        if (node.parentId === id && !idsToRemove.has(node.id)) {
          idsToRemove.add(node.id);
          collectChildren(node.id);
        }
      });
    }
    collectChildren(nodeId);

    treeData = treeData.filter(n => !idsToRemove.has(n.id));
  }
</script>

<Tree {treeData} />

<button onclick={() => addNode('1')}>添加子节点</button>
```

### 多棵树联动

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let tree1Ref: Tree;
  let tree2Ref: Tree;

  let tree1Data = [...];
  let tree2Data = [...];

  function syncExpansion(nodeId: string, expanded: boolean) {
    // 当一棵树展开节点时，同步展开另一棵树
    if (expanded) {
      tree2Ref?.expandToNode(nodeId);
    }
  }
</script>

<div class="two-trees">
  <Tree
    bind:this={tree1Ref}
    treeData={tree1Data}
    onExpand={(keys) => {
      // 可以根据需要同步状态
    }}
  />
  <Tree
    bind:this={tree2Ref}
    treeData={tree2Data}
  />
</div>
```

### 可拖拽树

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let treeRef: Tree;
  let draggedNodeId: string | null = null;

  let treeData = [...];

  function handleDragStart(nodeId: string) {
    draggedNodeId = nodeId;
  }

  function handleDrop(targetNodeId: string) {
    if (!draggedNodeId || draggedNodeId === targetNodeId) return;

    // 更新父节点 ID
    treeData = treeData.map(node => {
      if (node.id === draggedNodeId) {
        return { ...node, parentId: targetNodeId };
      }
      return node;
    });

    draggedNodeId = null;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }
</script>

<Tree
  bind:this={treeRef}
  {treeData}
  onNodeClick={(nodeId) => {
    // 处理点击
  }}
/>

<!-- 自定义拖拽实现需要结合 HTML5 Drag & Drop API -->
```

### 懒加载子节点

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let treeData = $state([
    { id: '1', name: '根节点', parentId: null, hasChildren: true },
  ]);

  let loadingNodes = new Set<string>();

  async function loadChildren(parentId: string) {
    if (loadingNodes.has(parentId)) return;

    loadingNodes.add(parentId);

    // 模拟异步加载
    const children = await fetchChildren(parentId);

    // 添加到树数据
    treeData = [...treeData, ...children];

    loadingNodes.delete(parentId);

    // 展开父节点
    treeRef?.expandToNode(parentId);
  }

  async function handleExpand(nodeId: string) {
    const node = treeData.find(n => n.id === nodeId);
    if (node && node.hasChildren) {
      // 检查是否已加载（通过查找是否有子节点）
      const hasLoaded = treeData.some(n => n.parentId === nodeId);
      if (!hasLoaded) {
        await loadChildren(nodeId);
      }
    }
  }
</script>

<Tree
  bind:this={treeRef}
  {treeData}
  onExpand={(keys, info) => {
    handleExpand(info.node.id);
  }}
/>
```

### 带工具栏的树

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let treeRef: Tree;
  let searchKeyword = $state('');
  let expandedKeys = $state<string[]>([]);

  function handleExpand(keys: string[]) {
    expandedKeys = keys;
  }
</script>

<div class="tree-container">
  <div class="toolbar">
    <input
      type="text"
      bind:value={searchKeyword}
      placeholder="搜索..."
    />
    <button onclick={() => treeRef?.search(searchKeyword)}>搜索</button>
    <button onclick={() => treeRef?.expandAll()}>展开</button>
    <button onclick={() => treeRef?.collapseAll()}>折叠</button>
    <button onclick={() => treeRef?.checkAll()}>全选</button>
  </div>

  <div class="tree-wrapper">
    <Tree
      bind:this={treeRef}
      {treeData}
      checkable
      searchable
      defaultExpandedKeys={expandedKeys}
      onExpand={handleExpand}
    />
  </div>
</div>

<style>
  .tree-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .toolbar {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
  }

  .tree-wrapper {
    flex: 1;
    overflow: hidden;
  }
</style>
```

### 表格中的树（树表联动）

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let treeRef: Tree;
  let selectedNodeId = $state<string | null>(null);

  const treeData = [...];

  function handleSelect(keys: string[]) {
    selectedNodeId = keys[0] ?? null;
  }

  function handleNodeClick(nodeId: string) {
    selectedNodeId = nodeId;
    treeRef?.select(nodeId);
  }
</script>

<div class="split-view">
  <div class="tree-panel">
    <Tree
      bind:this={treeRef}
      {treeData}
      onSelect={handleSelect}
    />
  </div>

  <div class="detail-panel">
    {#if selectedNodeId}
      {@const node = treeData.find(n => n.id === selectedNodeId)}
      <h3>{node?.name}</h3>
      <p>ID: {selectedNodeId}</p>
      <p>类型: {node?.type ?? '默认'}</p>
    {:else}
      <p>请选择一个节点</p>
    {/if}
  </div>
</div>

<style>
  .split-view {
    display: flex;
    height: 100%;
  }

  .tree-panel {
    width: 300px;
    border-right: 1px solid #e5e7eb;
  }

  .detail-panel {
    flex: 1;
    padding: 20px;
  }
</style>
```

---

## 最佳实践

### 1. 使用 bind:this 获取组件实例

```svelte
<!-- 推荐 -->
<script lang="ts">
  let treeRef: Tree;
</script>

<Tree bind:this={treeRef} />

<!-- 不推荐：直接在模板中调用方法 -->
<button onclick={tree.expandAll}>展开</button>
```

### 2. 合理使用搜索功能

```svelte
<!-- 小数据量使用同步搜索 -->
<Tree {treeData} searchable />

<!-- 大数据量建议配合防抖 -->
<script lang="ts">
  let treeRef: Tree;
  let searchKeyword = $state('');
  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      treeRef?.search(searchKeyword);
    }, 300);
  }
</script>
```

### 3. 状态管理与派生状态

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let treeRef: Tree;
  let checkedKeys = $derived(
    new Set(treeRef?.getCheckedKeys() ?? [])
  );

  // 监听勾选变化
  $effect(() => {
    if (treeRef) {
      // 使用 effect 监听变化
    }
  });
</script>
```

### 4. 大数据优化

```svelte
<!-- 启用虚拟滚动 -->
<Tree
  {treeData}
  itemHeight={32}  <!-- 使用较小的行高 -->
/>

<!-- 避免不必要的重新渲染 -->
{#key selectedId}
  <Tree {treeData} />
{/key}
```
