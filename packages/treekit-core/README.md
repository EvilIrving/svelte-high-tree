# treekit-core

树形数据结构引擎，框架无关的核心库。

## 特性

- **框架无关**：纯 TypeScript 实现，可与任何框架配合使用
- **高性能**：使用扁平化数据结构，O(1) 节点查询
- **功能丰富**：支持展开/折叠、复选框联动、过滤搜索、虚拟列表
- **可扩展**：提供算法和控制器，便于定制化需求

## 安装

```bash
npm install @light-cat/treekit-core
```

## 核心概念

### RawNode（原始节点）

后端返回的原始树形数据格式：

```typescript
interface RawNode {
  id: string;        // 节点唯一标识
  name: string;      // 节点显示名称
  parentId: string | null;  // 父节点 ID，根节点为 null
  [key: string]: unknown;   // 其他自定义字段
}
```

### TreeNode（树节点）

经过引擎处理后的扁平化节点：

```typescript
interface TreeNode {
  id: string;        // 节点唯一标识
  name: string;      // 节点显示名称
  parentId: string | null;  // 父节点 ID
  depth: number;     // 层级深度（根节点为 0）
  index: number;     // 在节点列表中的索引位置
  subtreeEnd: number; // 子树结束索引（包含自身）
  hasChildren: boolean;  // 是否有子节点
}
```

### TreeEngine

核心引擎类，管理树形数据的所有操作。

## 快速开始

```typescript
import { TreeEngine } from '@light-cat/treekit-core';

// 1. 准备原始数据
const rawData: RawNode[] = [
  { id: '1', name: '根节点', parentId: null },
  { id: '1-1', name: '子节点 A', parentId: '1' },
  { id: '1-2', name: '子节点 B', parentId: '1' },
];

// 2. 创建引擎实例
const engine = new TreeEngine({
  checkable: true,
  defaultExpandedKeys: ['1']
});

// 3. 初始化数据
engine.init(rawData);

// 4. 获取扁平化节点列表
console.log(engine.flatNodes);

// 5. 获取可见节点列表（根据展开状态）
console.log(engine.visibleList);
```

## API 参考

### TreeEngine

#### 构造函数

```typescript
new TreeEngine(options?: TreeOptions)
```

**TreeOptions 配置项：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `checkable` | `boolean` | `false` | 启用 checkbox 功能 |
| `accordion` | `boolean` | `false` | 手风琴模式（同级只展开一个） |
| `filterable` | `boolean` | `false` | 启用过滤功能 |
| `searchable` | `boolean` | `false` | 启用搜索功能 |
| `defaultExpandedKeys` | `string[]` | `[]` | 默认展开的节点 key 列表 |
| `defaultCheckedKeys` | `string[]` | `[]` | 默认勾选的节点 key 列表 |
| `checkStrictly` | `boolean` | `false` | 父子勾选不联动，无半选状态 |
| `defaultSelectedKeys` | `string[]` | `[]` | 默认选中的节点 key（单选） |
| `fieldMapper` | `FieldMapper` | 见下方 | 字段映射配置 |

**FieldMapper 配置项：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | `string` | `'id'` | 节点唯一标识字段名 |
| `parentId` | `string` | `'parentId'` | 父节点标识字段名 |
| `name` | `string` | `'name'` | 节点显示名称字段名 |
| `children` | `string` | `'children'` | 子节点列表字段名 |

#### 常用方法

| 方法 | 说明 |
|------|------|
| `init(rawNodes, fieldMapper?)` | 初始化树数据 |
| `toggle(index)` | 切换节点展开状态 |
| `expandAll()` | 展开所有节点 |
| `collapseAll()` | 折叠所有节点 |
| `expandToDepth(depth)` | 展开到指定深度 |
| `setChecked(index, value)` | 设置节点勾选状态 |
| `toggleCheck(index)` | 切换节点勾选状态 |
| `checkAll()` | 全选 |
| `uncheckAll()` | 全不选 |
| `getCheckedLeafIDs()` | 获取已勾选的叶子节点 ID |
| `setFilter(predicate)` | 设置过滤函数 |
| `setSearch(query)` | 设置搜索关键词 |
| `clearFilter()` | 清除过滤/搜索 |
| `select(nodeId)` | 选中指定节点（单选） |
| `clearSelection()` | 清除选中 |
| `getNode(nodeId)` | 根据 ID 获取节点 |
| `getVisibleIndex(nodeId)` | 获取节点在可见列表中的索引 |
| `getNodeStatus(nodeId)` | 获取节点状态 |
| `subscribe(fn)` | 订阅状态变化 |
| `batch(fn)` | 批量操作（事务模式） |

#### 只读属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `flatNodes` | `readonly TreeNode[]` | 所有扁平化节点 |
| `visibleList` | `readonly TreeNode[]` | 可见节点列表 |
| `totalCount` | `number` | 节点总数 |
| `visibleCount` | `number` | 可见节点数 |
| `checkedCount` | `number` | 已勾选节点数 |
| `expandedSet` | `ReadonlySet<string>` | 已展开节点 ID 集合 |
| `checkedSet` | `ReadonlySet<string>` | 已勾选节点 ID 集合 |
| `matchSet` | `ReadonlySet<string>` | 匹配搜索的节点 ID 集合 |
| `selectedId` | `string \| null` | 当前选中的节点 ID |
| `isAccordionMode` | `boolean` | 是否为手风琴模式 |
| `isCheckStrictly` | `boolean` | 是否为严格勾选模式 |

### 算法函数

#### 扁平树算法

```typescript
import { buildFlatTree, getAncestorIDs, getAncestorSet, getSubtreeIDs } from '@light-cat/treekit-core';
```

| 函数 | 说明 |
|------|------|
| `buildFlatTree(rawNodes, fieldMapper)` | 构建扁平化树结构 |
| `getAncestorIDs(nodeId, index)` | 获取节点的所有祖先 ID |
| `getAncestorSet(nodeId, index)` | 获取节点的祖先 ID 集合 |
| `getSubtreeIDs(nodeId, index)` | 获取节点的子树所有节点 ID |

#### 可见性算法

```typescript
import { computeVisibleNodes, computeFilteredVisibleNodes, toggleExpand, expandToNode, expandMultiple, collapseSiblings } from '@light-cat/treekit-core';
```

| 函数 | 说明 |
|------|------|
| `computeVisibleNodes(flatNodes, expandedSet)` | 计算可见节点列表 |
| `computeFilteredVisibleNodes(flatNodes, expandedSet, filterSet)` | 计算过滤后的可见节点列表 |
| `toggleExpand(nodeId, expandedSet)` | 切换节点展开状态 |
| `expandToNode(nodeId, expandedSet, nodeMap)` | 展开到指定节点 |
| `expandMultiple(newIds, expandedSet)` | 批量展开节点 |
| `collapseSiblings(nodeId, flatNodes, expandedSet, nodeMap)` | 收起同级兄弟节点 |

#### 复选框算法

```typescript
import { toggleCheck, getCheckState, checkAll, uncheckAll, getCheckedLeafIDs } from '@light-cat/treekit-core';
```

| 函数 | 说明 |
|------|------|
| `toggleCheck(nodeId, flatNodes, checkedSet, index)` | 切换节点勾选状态 |
| `getCheckState(node, flatNodes, checkedSet)` | 获取节点勾选状态 |
| `checkAll(flatNodes)` | 全选 |
| `uncheckAll()` | 全不选 |
| `getCheckedLeafIDs(flatNodes, checkedSet)` | 获取已勾选的叶子节点 ID |

### VirtualListController

虚拟列表控制器，用于实现大数据量的虚拟滚动：

```typescript
import { VirtualListController, calculateVisibleRange } from '@light-cat/treekit-core';

const controller = new VirtualListController({
  itemHeight: 32,  // 每项高度
  buffer: 5        // 缓冲区大小
});

// 计算可见范围
const { start, end } = controller.calculateVisibleRange(scrollTop, containerHeight, totalCount);
```

### SearchController

搜索控制器，支持 Web Worker 异步搜索：

```typescript
import { SearchController, searchSync, DEFAULT_SEARCH_CONFIG, createSearchConfig } from '@light-cat/treekit-core';

// 创建搜索配置
const config = createSearchConfig({
  enableNavigation: true,  // 启用导航
  enableLoop: true,        // 循环搜索
  showCount: true,         // 显示数量
  debounceMs: 300          // 防抖延迟
});

// 同步搜索（适合小数据量）
const result = searchSync(keyword, flatNodes, config);

// 异步搜索（Web Worker，适合大数据量）
const controller = new SearchController({
  debounceMs: 300,
  onResult: (result) => {
    // 处理搜索结果
  }
});
controller.init(treeData);
controller.search(keyword);
```

## 字段映射

支持自定义数据格式：

```typescript
const engine = new TreeEngine({
  fieldMapper: {
    id: 'key',           // 自定义 ID 字段
    parentId: 'pid',     // 自定义父 ID 字段
    name: 'label',       // 自定义名称字段
    children: 'items'    // 自定义子节点字段
  }
});
```

## 订阅与批量操作

```typescript
// 订阅状态变化
const unsubscribe = engine.subscribe(() => {
  console.log('状态已更新', engine.visibleList);
});

// 批量操作（合并为一次通知）
engine.batch(() => {
  engine.expandAll();
  engine.checkAll();
});
// 只触发一次通知
```

## 与框架集成

### React 示例

```typescript
import { useState, useEffect, useRef } from 'react';
import { TreeEngine } from '@light-cat/treekit-core';

function Tree({ data }) {
  const engineRef = useRef(new TreeEngine());
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    engineRef.current.init(data);
    const unsubscribe = engineRef.current.subscribe(() => {
      setNodes([...engineRef.current.visibleList]);
    });
    return unsubscribe;
  }, [data]);

  return (
    <ul>
      {nodes.map(node => (
        <li key={node.id}>{node.name}</li>
      ))}
    </ul>
  );
}
```

### Vue 示例

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { TreeEngine } from '@light-cat/treekit-core';

export default {
  setup() {
    const engine = new TreeEngine();
    const visibleNodes = ref([]);

    const updateNodes = () => {
      visibleNodes.value = [...engine.visibleList];
    };

    onMounted(() => {
      engine.init(props.data);
      engine.subscribe(updateNodes);
    });

    return { visibleNodes };
  }
};
```

## 许可证

MIT
