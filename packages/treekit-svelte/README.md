# treekit-svelte

Svelte 5 树形组件库，基于 treekit-core 构建。

## 特性

- **Svelte 5 原生**：使用 Runes 和 Snippets 全新设计
- **虚拟滚动**：支持大数据量渲染，性能优异
- **搜索导航**：内置搜索功能，支持键盘导航
- **丰富的交互**：复选框、节点选择、双击展开
- **完全可控**：所有方法通过组件实例暴露
- **样式可定制**：CSS 变量支持主题定制

## 安装

```bash
npm install @light-cat/treekit-svelte @light-cat/treekit-core
```

peerDependencies:
- `svelte >=5.0.0`

## 快速开始

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  const treeData = [
    { id: '1', name: '根节点', parentId: null },
    { id: '1-1', name: '子节点 A', parentId: '1' },
    { id: '1-2', name: '子节点 B', parentId: '1' },
  ];

  let treeRef: Tree;
</script>

<Tree
  bind:this={treeRef}
  {treeData}
  checkable
  searchable
  onCheck={(keys, info) => console.log('勾选:', keys)}
  onSelect={(keys, info) => console.log('选中:', keys)}
/>
```

## 组件

### Tree

主树组件，支持虚拟滚动、搜索、复选框等功能。

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  const treeData = [...];
  let treeRef: Tree;
</script>

<Tree
  bind:this={treeRef}
  {treeData}
  checkable={true}
  searchable={true}
  itemHeight={32}
/>
```

### VirtualList

通用虚拟列表组件，可用于自定义树形结构或其他列表场景。

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
>
  <div class="item">{item.name}</div>
</VirtualList>
```

### VirtualTree

虚拟树组件（底层组件），用于自定义树组件。

```svelte
<script lang="ts">
  import { VirtualTree } from '@light-cat/treekit-svelte';

  let { visibleList, flatNodes, expandedSet, checkedSet } = $props();
</script>

<VirtualTree
  {visibleList}
  {flatNodes}
  {expandedSet}
  {checkedSet}
  {itemHeight}
  showCheckbox
  onToggleExpand={(id) => ...}
  onToggleCheck={(id) => ...}
  onNodeClick={(id) => ...}
/>
```

## API 参考

### Tree Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `treeData` | `RawNode[]` | 必填 | 树形数据 |
| `fieldMapper` | `FieldMapper` | 默认配置 | 字段映射 |
| `checkable` | `boolean` | `false` | 显示复选框 |
| `checkStrictly` | `boolean` | `false` | 父子勾选不联动 |
| `defaultCheckedKeys` | `string[]` | `[]` | 默认勾选的节点 |
| `defaultExpandedKeys` | `string[]` | `[]` | 默认展开的节点 |
| `defaultSelectedKeys` | `string[]` | `[]` | 默认选中的节点 |
| `selectable` | `boolean` | `true` | 允许节点选中 |
| `searchable` | `boolean` | `false` | 启用搜索功能 |
| `itemHeight` | `number` | `32` | 行高（像素） |
| `class` | `string` | `''` | 额外 CSS 类 |
| `onCheck` | `(keys, info) => void` | - | 勾选回调 |
| `onSelect` | `(keys, info) => void` | - | 选中回调 |
| `onExpand` | `(keys, info) => void` | - | 展开回调 |

### Tree 方法

| 方法 | 说明 |
|------|------|
| `expandAll()` | 展开所有节点 |
| `collapseAll()` | 收起所有节点 |
| `expandToDepth(depth)` | 展开到指定深度 |
| `checkAll()` | 全选 |
| `uncheckAll()` | 取消全选 |
| `scrollToNode(nodeId)` | 滚动到指定节点 |
| `getCheckedLeafKeys()` | 获取已勾选的叶子节点 ID |
| `getCheckedKeys()` | 获取所有已勾选的节点 ID |
| `getSelectedKey()` | 获取当前选中的节点 ID |
| `search(keyword)` | 执行搜索 |
| `clearSearch()` | 清除搜索 |
| `nextMatch()` | 跳转到下一个匹配项 |
| `prevMatch()` | 跳转到上一个匹配项 |
| `getSearchState()` | 获取搜索状态 |
| `getStats()` | 获取树状态统计 |

### Tree 回调参数

```typescript
// onCheck, onSelect 回调参数
{
  node: TreeNode,      // 触发事件的节点
  checked: boolean,    // 是否已勾选/选中
  selected: boolean
}

// onExpand 回调参数
{
  node: TreeNode,      // 触发事件的节点
  expanded: boolean    // 是否已展开
}
```

### VirtualList Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `items` | `T[]` | 必填 | 数据列表 |
| `itemHeight` | `number` | `32` | 每项高度 |
| `containerHeight` | `number` | `400` | 容器高度 |
| `buffer` | `number` | `5` | 缓冲区大小 |

### VirtualList Slots

```svelte
<VirtualList {items} let:item let:index>
  <div class="item">
    {index}: {item.name}
  </div>
</VirtualList>
```

## 搜索功能

### 启用搜索

```svelte
<Tree
  {treeData}
  searchable
  bind:this={treeRef}
/>
```

### 搜索 API

```typescript
// 执行搜索
treeRef.search('关键词');

// 清除搜索
treeRef.clearSearch();

// 导航到下一个匹配
treeRef.nextMatch();

// 导航到上一个匹配
treeRef.prevMatch();

// 获取搜索状态
const state = treeRef.getSearchState();
console.log(state.hasMatches);  // 是否有匹配
console.log(state.current);     // 当前匹配项索引（从 1 开始）
console.log(state.total);       // 匹配总数
```

### 搜索高亮

搜索时匹配的节点会自动高亮显示，可通过 CSS 定制样式：

```css
.treekit-tree-node.match {
  background-color: yellow;
}
```

## 虚拟滚动

默认启用虚拟滚动，支持大数据量渲染。

```svelte
<Tree
  {treeData}
  itemHeight={40}  // 自定义行高
/>
```

## 样式定制

### CSS 变量

```css
.treekit-tree {
  /* 容器样式 */
  --treekit-bg: #fff;
  --treekit-border: #e5e7eb;
  --treekit-height: 400px;
}

.treekit-tree-node {
  /* 节点样式 */
  --treekit-node-height: 32px;
  --treekit-node-padding: 8px;
  --treekit-hover-bg: #f3f4f6;
  --treekit-selected-bg: #e0f2fe;
  --treekit-match-bg: #fef08a;
}

.treekit-tree-indent {
  /* 缩进样式 */
  --treekit-indent-width: 20px;
}

.treekit-tree-checkbox {
  /* 复选框样式 */
  --treekit-checkbox-size: 16px;
  --treekit-checkbox-checked: #3b82f6;
  --treekit-checkbox-indeterminate: #93c5fd;
}

.treekit-tree-switcher {
  /* 展开图标样式 */
  --treekit-switcher-size: 16px;
  --treekit-switcher-color: #6b7280;
  --treekit-switcher-expanded-color: #3b82f6;
}
```

### 完整样式

组件内置默认样式，如需完全自定义可覆盖：

```css
.treekit-tree {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--treekit-border);
  border-radius: 6px;
  background: var(--treekit-bg);
}

.treekit-tree-node {
  display: flex;
  align-items: center;
  height: var(--treekit-node-height);
  padding: 0 var(--treekit-node-padding);
  cursor: pointer;
  user-select: none;
}

.treekit-tree-node:hover {
  background: var(--treekit-hover-bg);
}

.treekit-tree-node.selected {
  background: var(--treekit-selected-bg);
}

.treekit-tree-node.match {
  background: var(--treekit-match-bg);
}

.treekit-tree-switcher {
  width: var(--treekit-switcher-size);
  height: var(--treekit-switcher-size);
  margin-right: 4px;
  color: var(--treekit-switcher-color);
  transition: transform 0.15s;
}

.treekit-tree-switcher.expanded {
  transform: rotate(90deg);
  color: var(--treekit-switcher-expanded-color);
}

.treekit-tree-checkbox {
  width: var(--treekit-checkbox-size);
  height: var(--treekit-checkbox-size);
  margin-right: 8px;
}

.treekit-tree-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.treekit-tree-indent {
  width: var(--treekit-indent-width);
}
```

## 事件处理

### 勾选事件

```svelte
<Tree
  {treeData}
  checkable
  onCheck={(keys, info) => {
    console.log('已勾选的节点:', keys);
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
  onSelect={(keys, info) => {
    console.log('当前选中:', keys);
    console.log('操作的节点:', info.node);
    console.log('选中状态:', info.selected);
  }}
/>
```

### 展开事件

```svelte
<Tree
  {treeData}
  onExpand={(keys, info) => {
    console.log('已展开的节点:', keys);
    console.log('操作的节点:', info.node);
    console.log('展开状态:', info.expanded);
  }}
/>
```

## 键盘导航

启用搜索功能后，支持以下键盘操作：

| 按键 | 动作 |
|------|------|
| `ArrowUp` | 上一个节点 |
| `ArrowDown` | 下一个节点 |
| `Enter` | 选中节点 |
| `Space` | 切换展开/折叠 |
| `F3` / `Ctrl+F` | 聚焦搜索框 |

## 与 treekit-core 结合使用

可以直接使用 treekit-core 的类型和函数：

```typescript
import { Tree } from '@light-cat/treekit-svelte';
import type { TreeNode, RawNode, TreeOptions } from '@light-cat/treekit-core';
import { TreeEngine } from '@light-cat/treekit-core';

const engine = new TreeEngine();
```

## 常见问题

### 如何获取组件实例？

使用 `bind:this` 绑定组件实例：

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let treeRef: Tree;
</script>

<Tree bind:this={treeRef} {treeData} />

<button onclick={() => treeRef?.expandAll()}>
  展开全部
</button>
```

### 如何动态更新数据？

直接更新 `treeData` prop，组件会自动响应：

```svelte
<script lang="ts">
  import { Tree } from '@light-cat/treekit-svelte';

  let treeData = $state([...]);
</script>

<Tree {treeData} />

<button onclick={() => {
  treeData = [...treeData, newNode];
}}>
  添加节点
</button>
```

### 如何自定义节点内容？

可以通过插槽或事件处理自定义渲染：

```svelte
<Tree
  {treeData}
  onRenderNode={(node) => {
    if (node.type === 'folder') {
      return `<span class="folder">${node.name}</span>`;
    }
    return node.name;
  }}
/>
```

或者使用 `VirtualTree` 底层组件完全自定义：

```svelte
<script lang="ts">
  import { VirtualTree } from '@light-cat/treekit-svelte';

  let { tree } = $props();
</script>

<VirtualTree
  visibleList={tree.visibleList}
  flatNodes={tree.flatNodes}
  expandedSet={tree.expandedSet}
  checkedSet={tree.checkedSet}
>
  {#snippet node(node, status)}
    <div class="custom-node">
      {#if node.hasChildren}
        <span class="switcher" class:expanded={status.isExpanded}>
          ▶
        </span>
      {:else}
        <span class="placeholder" />
      {/if}
      <input type="checkbox" checked={status.isChecked} />
      <span class="name">{node.name}</span>
    </div>
  {/snippet}
</VirtualTree>
```

## 许可证

MIT
