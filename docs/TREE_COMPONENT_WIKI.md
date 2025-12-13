# 高性能 Tree 组件技术文档

## 目录

1. [项目概述](#项目概述)
2. [架构设计](#架构设计)
3. [核心数据结构](#核心数据结构)
4. [核心算法详解](#核心算法详解)
5. [组件使用指南](#组件使用指南)
6. [性能优化策略](#性能优化策略)
7. [API 参考](#api-参考)

---

## 项目概述

本项目是一个基于 **SvelteKit + Svelte 5** 的高性能 Tree 组件，专为处理**数万级节点**而设计，在 50,000+ 节点规模下仍能保持流畅的交互体验。

### 核心特性

| 特性 | 描述 |
|------|------|
| 🔥 **虚拟滚动** | 基于 IntersectionObserver，仅渲染可见区域 |
| 🔍 **模糊搜索** | Web Worker 异步搜索 + 倒排索引加速，支持过滤模式 |
| ☑️ **复选框** | 支持全选/半选/取消，父子联动 |
| 📂 **展开/收起** | 批量操作整棵子树，O(1) 子树定位 |
| ⚡ **扁平化渲染** | 非嵌套结构，避免递归渲染性能问题 |

### 技术栈

- **框架**: SvelteKit 2.x + Svelte 5
- **语言**: TypeScript
- **状态管理**: Svelte 5 Runes ($state / $derived)
- **构建工具**: Vite

---

## 架构设计

### 三层架构

```
┌────────────────────────────────────────────────────────┐
│                    渲染层 (Rendering)                   │
│   VirtualTree.svelte  │  TreeNodeRow.svelte            │
│   - 虚拟滚动容器        │  - 单行节点渲染                 │
│   - IntersectionObserver│  - 展开/复选框/名称            │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                    状态层 (State)                       │
│                 TreeManager.svelte.ts                  │
│   - expandedSet: 展开状态                               │
│   - checkedSet: 勾选状态                                │
│   - searchMatchSet / searchFilterSet: 搜索状态          │
│   - visibleList: 派生的可见节点列表                      │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                    数据层 (Data)                        │
│   flatNodes[]  │  TreeIndex  │  SearchController       │
│   - 扁平化数组   │  - nodeMap   │  - Web Worker         │
│   - subtreeEnd │  - indexMap  │  - 倒排索引            │
│                │  - childrenMap│                       │
└────────────────────────────────────────────────────────┘
```

### 设计原则

1. **大数据不进响应式系统**：`flatNodes[]` 和索引结构作为普通变量存储
2. **小状态用 Set 管理**：展开/勾选状态使用 `Set<string>` + 不可变替换
3. **派生计算惰性执行**：`visibleList` 通过 `$derived` 自动响应状态变化
4. **搜索异步化**：Web Worker 隔离计算密集型搜索操作

---

## 核心数据结构

### RawNode（原始数据）

后端返回的邻接表格式：

```typescript
interface RawNode {
  id: string;
  name: string;
  parentId: string | null;  // null 表示根节点
}
```

### FlatNode（扁平化节点）

核心数据结构，支持高效遍历和子树操作：

```typescript
interface FlatNode {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;      // 层级深度（根节点为 0）
  index: number;      // 在 flatNodes 数组中的索引
  subtreeEnd: number; // 子树结束索引（包含自身）【关键字段】
  hasChildren: boolean;
}
```

**subtreeEnd 的意义**：

```
节点 A (index=0, subtreeEnd=5)
├── 节点 B (index=1, subtreeEnd=3)
│   ├── 节点 D (index=2, subtreeEnd=2)
│   └── 节点 E (index=3, subtreeEnd=3)
├── 节点 C (index=4, subtreeEnd=5)
│   └── 节点 F (index=5, subtreeEnd=5)

A 的子树范围：flatNodes[0..5]（6个节点）
B 的子树范围：flatNodes[1..3]（3个节点）
```

### TreeIndex（索引结构）

提供 O(1) 查询能力：

```typescript
interface TreeIndex {
  nodeMap: Map<string, FlatNode>;     // id → 节点
  indexMap: Map<string, number>;       // id → 数组索引
  childrenMap: Map<string | null, string[]>; // parentId → 子节点 ID 列表
  rootIds: string[];                   // 根节点 ID 列表
}
```

---

## 核心算法详解

### 1. 扁平化算法 (flatten.ts)

**目标**：将邻接表转换为 DFS 序扁平数组，并计算每个节点的 `subtreeEnd`。

**算法**：迭代 DFS + 两阶段处理（enter/exit）

```typescript
// 栈元素结构
interface StackItem {
  id: string;
  depth: number;
  phase: 'enter' | 'exit';  // 关键：区分进入和退出
}

// 核心逻辑
while (stack.length > 0) {
  const { id, depth, phase } = stack.pop()!;
  
  if (phase === 'enter') {
    // 进入阶段：创建节点，压入数组
    const flatNode = createNode(id, depth, flatNodes.length);
    flatNodes.push(flatNode);
    
    // 压入 exit 标记 + 子节点
    stack.push({ id, depth, phase: 'exit' });
    for (child of children.reverse()) {
      stack.push({ id: child, depth: depth + 1, phase: 'enter' });
    }
  } else {
    // 退出阶段：此时所有子节点都已处理完毕
    node.subtreeEnd = flatNodes.length - 1;  // 关键！
  }
}
```

**时间复杂度**：O(n)，每个节点恰好被访问两次（enter + exit）

### 2. 可见节点计算 (visibility.ts)

**普通模式**：利用 `subtreeEnd` 跳过折叠子树

```typescript
function computeVisibleNodes(flatNodes, expandedSet): FlatNode[] {
  const visible = [];
  let i = 0;
  
  while (i < flatNodes.length) {
    const node = flatNodes[i];
    visible.push(node);
    
    if (node.hasChildren && !expandedSet.has(node.id)) {
      i = node.subtreeEnd + 1;  // 跳过整个子树！
    } else {
      i++;
    }
  }
  return visible;
}
```

**过滤模式**（搜索）：只显示匹配节点 + 祖先路径

```typescript
function computeFilteredVisibleNodes(
  flatNodes, expandedSet, filterSet
): FlatNode[] {
  if (filterSet.size === 0) {
    return computeVisibleNodes(flatNodes, expandedSet);
  }
  
  const visible = [];
  let i = 0;
  
  while (i < flatNodes.length) {
    const node = flatNodes[i];
    
    if (filterSet.has(node.id)) {
      visible.push(node);
      
      if (node.hasChildren && !expandedSet.has(node.id)) {
        i = node.subtreeEnd + 1;
      } else {
        i++;
      }
    } else {
      // 不在过滤集合，跳过整个子树
      i = node.subtreeEnd + 1;
    }
  }
  return visible;
}
```

**时间复杂度**：O(visibleCount)，与可见节点数成正比，而非总节点数

### 3. 复选框算法 (checkbox.ts)

**勾选规则**：
- 勾选节点 → 勾选整个子树
- 取消节点 → 取消整个子树
- 父节点状态由子节点决定（全选/半选/未选）

**批量操作子树**（利用 subtreeEnd）：

```typescript
function toggleCheck(nodeId, flatNodes, checkedSet, index) {
  const node = index.nodeMap.get(nodeId);
  const isChecked = checkedSet.has(nodeId);
  
  // O(subtreeSize) 批量操作
  for (let i = node.index; i <= node.subtreeEnd; i++) {
    if (isChecked) {
      newSet.delete(flatNodes[i].id);
    } else {
      newSet.add(flatNodes[i].id);
    }
  }
  
  // 向上更新祖先
  updateAncestors(node.parentId, ...);
  return newSet;
}
```

**半选状态**（惰性计算）：

```typescript
function getCheckState(node, flatNodes, checkedSet): CheckState {
  if (checkedSet.has(node.id)) return 'checked';
  if (!node.hasChildren) return 'unchecked';
  
  // 只在渲染时计算半选
  for (let i = node.index + 1; i <= node.subtreeEnd; i++) {
    if (checkedSet.has(flatNodes[i].id)) return 'indeterminate';
  }
  return 'unchecked';
}
```

### 4. 虚拟滚动 (virtual-list.ts)

**实现方案**：IntersectionObserver + 固定行高 + 绝对定位

```typescript
class VirtualListController {
  private observer: IntersectionObserver;
  private itemHeight: number;
  private bufferSize: number;  // 上下缓冲区大小
  
  init(container, topSentinel, bottomSentinel) {
    this.observer = new IntersectionObserver(
      this.handleIntersection,
      {
        root: container,
        rootMargin: `${bufferSize * itemHeight}px 0px`,
        threshold: 0
      }
    );
    
    this.observer.observe(topSentinel);
    this.observer.observe(bottomSentinel);
  }
  
  recalculate() {
    const scrollTop = container.scrollTop;
    const scrollIndex = Math.floor(scrollTop / itemHeight);
    
    startIndex = Math.max(0, scrollIndex - bufferSize);
    endIndex = Math.min(total, scrollIndex + viewportNodes + bufferSize);
    offsetTop = startIndex * itemHeight;
  }
}
```

**渲染结构**：

```svelte
<div class="container" style="overflow: auto">
  <!-- 撑起总高度的占位容器 -->
  <div style="height: {totalHeight}px; position: relative">
    <!-- 顶部哨兵（触发向上滚动） -->
    <div class="sentinel-top" style="top: {offsetTop - 1}px" />
    
    <!-- 实际渲染的节点 -->
    <div style="position: absolute; top: {offsetTop}px">
      {#each renderList as node}
        <TreeNodeRow {node} />
      {/each}
    </div>
    
    <!-- 底部哨兵（触发向下滚动） -->
    <div class="sentinel-bottom" />
  </div>
</div>
```

### 5. 异步搜索 (search.worker.ts + search-controller.ts)

**架构**：

```
主线程                          Worker 线程
┌──────────────┐              ┌──────────────┐
│SearchController│ ──init──▶ │search.worker │
│              │              │              │
│ search(kw)  │ ──search──▶ │ 倒排索引查询  │
│              │              │              │
│ onResult()  │ ◀──result── │ 收集祖先节点  │
└──────────────┘              └──────────────┘
```

**倒排索引**：

```typescript
// 分词：camelCase、下划线、空格
function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase
    .replace(/[_\-\.\/\\]/g, ' ')         // 分隔符
    .split(/\s+/)
    .filter(t => t.length > 0);
}

// 构建索引：token → nodeIds
for (const node of data) {
  for (const token of tokenize(node.name)) {
    invertedIndex.get(token).add(node.id);
  }
}
```

**搜索流程**：

1. 用户输入 → SearchController.search() → 防抖 200ms
2. Worker 接收关键词 → 倒排索引前缀/包含匹配
3. 收集匹配节点的所有祖先 ID
4. 返回 `{ matchIds, expandIds }` → TreeManager.applySearchResult()
5. 更新 `searchFilterSet` 和 `expandedSet`

---

## 组件使用指南

### 基础使用

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createTreeManager, SearchController, generateTestTree } from '$lib/tree';
  import VirtualTree from '$lib/components/VirtualTree.svelte';
  
  const manager = createTreeManager();
  let searchController: SearchController;
  
  onMount(() => {
    // 生成测试数据（50000 节点）
    const rawNodes = generateTestTree(10000, 5);
    manager.init(rawNodes);
    
    // 初始化搜索
    searchController = new SearchController({
      debounceMs: 200,
      onResult: (result) => manager.applySearchResult(result)
    });
    searchController.init(manager.rawNodes);
  });
  
  onDestroy(() => {
    searchController?.destroy();
  });
  
  function handleSearch(e: Event) {
    const keyword = (e.target as HTMLInputElement).value;
    manager.searchKeyword = keyword;
    
    if (keyword) {
      searchController.search(keyword);
    } else {
      manager.clearSearch();
    }
  }
</script>

<div class="tree-demo">
  <!-- 工具栏 -->
  <div class="toolbar">
    <input type="text" placeholder="搜索..." oninput={handleSearch} />
    <button onclick={() => manager.expandAll()}>全部展开</button>
    <button onclick={() => manager.collapseAll()}>全部收起</button>
    <button onclick={() => manager.checkAll()}>全选</button>
    <button onclick={() => manager.uncheckAll()}>取消全选</button>
  </div>
  
  <!-- 状态统计 -->
  <div class="stats">
    总节点: {manager.totalNodeCount} |
    可见: {manager.visibleNodeCount} |
    已选: {manager.checkedCount}
  </div>
  
  <!-- 树组件 -->
  <div class="tree-wrapper" style="height: 500px">
    <VirtualTree
      visibleList={manager.visibleList}
      flatNodes={manager.flatNodes}
      expandedSet={manager.expandedSet}
      checkedSet={manager.checkedSet}
      searchMatchSet={manager.searchMatchSet}
      index={manager.index}
      itemHeight={32}
      onToggleExpand={(id) => manager.toggleExpand(id)}
      onToggleCheck={(id) => manager.toggleCheck(id)}
    />
  </div>
</div>
```

### 自定义节点图标

在 `TreeNodeRow.svelte` 中添加图标插槽：

```svelte
<script>
  interface Props {
    // ... 现有 props
    icon?: string;  // 可选图标
  }
</script>

<div class="tree-node-row">
  <button class="expand-btn">...</button>
  <label class="checkbox-wrapper">...</label>
  
  <!-- 图标 -->
  {#if icon}
    <img src={icon} alt="" class="node-icon" />
  {/if}
  
  <span class="node-name">{node.name}</span>
</div>

<style>
  .node-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
</style>
```

**性能影响**：每行增加一个图标，对性能影响很小，因为：
1. 虚拟滚动确保只渲染可见行
2. 图标应使用固定尺寸避免布局抖动
3. 建议使用 SVG 或雪碧图减少 HTTP 请求

---

## 性能优化策略

### 1. 数据层优化

| 策略 | 说明 |
|------|------|
| 扁平化数组 | 避免嵌套递归，线性遍历更快 |
| subtreeEnd 索引 | O(1) 定位子树范围，批量操作不递归 |
| 普通变量存储大数据 | `flatNodes[]` 不进 Svelte 响应式系统 |

### 2. 状态层优化

| 策略 | 说明 |
|------|------|
| Set 不可变替换 | `new Set(oldSet)` 触发更新，性能可控 |
| $derived 惰性计算 | `visibleList` 仅在依赖变化时重算 |
| 按需计算半选 | `indeterminate` 状态仅在渲染时计算 |

### 3. 渲染层优化

| 策略 | 说明 |
|------|------|
| IntersectionObserver | 比 scroll 事件监听更高效 |
| 固定行高 | 避免动态高度计算开销 |
| 绝对定位 | 跳过 CSS 布局计算 |
| key={node.id} | 确保 DOM 复用 |

### 4. 搜索优化

| 策略 | 说明 |
|------|------|
| Web Worker | 不阻塞主线程 |
| 倒排索引 | 前缀/包含匹配 O(tokens) |
| 防抖 200ms | 减少无效搜索请求 |

---

## API 参考

### TreeManager

| 属性/方法 | 类型 | 描述 |
|-----------|------|------|
| `init(rawNodes)` | `void` | 初始化树数据 |
| `flatNodes` | `FlatNode[]` | 扁平化节点数组（只读） |
| `index` | `TreeIndex` | 索引结构（只读） |
| `expandedSet` | `Set<string>` | 展开状态集合 |
| `checkedSet` | `Set<string>` | 勾选状态集合 |
| `searchMatchSet` | `Set<string>` | 搜索匹配节点集合 |
| `searchFilterSet` | `Set<string>` | 搜索过滤集合（匹配+祖先） |
| `visibleList` | `FlatNode[]` | 当前可见节点列表（派生） |
| `toggleExpand(id)` | `void` | 切换展开状态 |
| `expandAll()` | `void` | 全部展开 |
| `collapseAll()` | `void` | 全部收起 |
| `expandToDepth(depth)` | `void` | 展开到指定深度 |
| `toggleCheck(id)` | `void` | 切换勾选状态 |
| `checkAll()` | `void` | 全选 |
| `uncheckAll()` | `void` | 取消全选 |
| `getCheckState(node)` | `CheckState` | 获取节点勾选状态 |
| `getCheckedLeafIds()` | `string[]` | 获取已选叶子节点 ID |
| `applySearchResult(result)` | `void` | 应用搜索结果 |
| `clearSearch()` | `void` | 清除搜索 |

### SearchController

| 属性/方法 | 类型 | 描述 |
|-----------|------|------|
| `init(searchData)` | `void` | 初始化 Worker |
| `search(keyword)` | `void` | 执行搜索（带防抖） |
| `searchImmediate(keyword)` | `void` | 立即搜索 |
| `clear()` | `void` | 清除搜索 |
| `ready` | `boolean` | Worker 是否就绪 |
| `destroy()` | `void` | 销毁 Worker |

### VirtualTree Props

| Prop | 类型 | 必填 | 描述 |
|------|------|------|------|
| `visibleList` | `FlatNode[]` | ✓ | 可见节点列表 |
| `flatNodes` | `FlatNode[]` | ✓ | 完整扁平节点数组 |
| `expandedSet` | `Set<string>` | ✓ | 展开状态 |
| `checkedSet` | `Set<string>` | ✓ | 勾选状态 |
| `searchMatchSet` | `Set<string>` | ✓ | 搜索匹配集合 |
| `index` | `TreeIndex` | ✓ | 索引结构 |
| `itemHeight` | `number` | | 行高（默认 32） |
| `onToggleExpand` | `(id) => void` | ✓ | 展开回调 |
| `onToggleCheck` | `(id) => void` | ✓ | 勾选回调 |

### VirtualTree Methods

| 方法 | 描述 |
|------|------|
| `scrollToNode(id)` | 滚动到指定节点 |
| `scrollToTop()` | 滚动到顶部 |
| `scrollToBottom()` | 滚动到底部 |

---

## 文件结构

```
src/lib/tree/
├── types.ts              # 类型定义
├── flatten.ts            # 扁平化算法
├── visibility.ts         # 可见节点计算
├── checkbox.ts           # 复选框逻辑
├── virtual-list.ts       # 虚拟列表控制器
├── search.worker.ts      # Web Worker 搜索
├── search-controller.ts  # 搜索控制器
├── tree-manager.svelte.ts# 状态管理器
├── test-data.ts          # 测试数据生成器
└── index.ts              # 统一导出

src/lib/components/
├── VirtualTree.svelte    # 虚拟树容器组件
└── TreeNodeRow.svelte    # 节点行组件
```

---

## 版本历史

- **v1.0.0** - 初始版本，支持基本的展开/勾选/虚拟滚动
- **v1.1.0** - 添加搜索过滤模式，搜索结果自动展开祖先路径

---

*文档最后更新：2024年12月*