# 使用指南

本指南详细介绍 treekit-core 的各种使用场景和最佳实践。

## 目录

- [基础用法](#基础用法)
- [复选框功能](#复选框功能)
- [搜索与过滤](#搜索与过滤)
- [虚拟列表](#虚拟列表)
- [自定义字段映射](#自定义字段映射)
- [与框架集成](#与框架集成)
- [性能优化](#性能优化)

---

## 基础用法

### 创建简单树

```typescript
import { TreeEngine } from '@light-cat/treekit-core';

const rawData = [
  { id: '1', name: '中国', parentId: null },
  { id: '1-1', name: '北京', parentId: '1' },
  { id: '1-2', name: '上海', parentId: '1' },
  { id: '1-3', name: '广东', parentId: '1' },
  { id: '1-3-1', name: '深圳', parentId: '1-3' },
  { id: '1-3-2', name: '广州', parentId: '1-3' },
];

const engine = new TreeEngine();
engine.init(rawData);

// 获取所有节点
console.log(engine.flatNodes);
// 输出: [{ id: '1', name: '中国', depth: 0, ... }, ...]

// 获取可见节点（根据展开状态）
console.log(engine.visibleList);
```

### 展开和折叠

```typescript
// 展开单个节点（通过索引）
const nodeIndex = engine.flatNodes.findIndex(n => n.id === '1-3');
engine.toggle(nodeIndex);

// 展开所有节点
engine.expandAll();

// 折叠所有节点
engine.collapseAll();

// 展开到指定深度
engine.expandToDepth(2);

// 展开到指定节点（自动展开所有祖先）
engine.expandToNode('1-3-1');
```

### 节点选择

```typescript
// 选中节点
engine.select('1-3-1');

// 清除选中
engine.clearSelection();

// 获取当前选中
console.log(engine.selectedId); // '1-3-1'

// 获取节点信息
const node = engine.getNode('1-3-1');
console.log(node);
// 输出: { id: '1-3-1', name: '深圳', depth: 2, parentId: '1-3', ... }

// 获取节点在可见列表中的索引
const visibleIndex = engine.getVisibleIndex('1-3-1');
console.log(visibleIndex); // 4

// 获取节点状态
const status = engine.getNodeStatus('1-3-1');
console.log(status);
// 输出: { isExpanded: true, isChecked: false, isIndeterminate: false, isVisible: true, visibleIndex: 4 }
```

---

## 复选框功能

### 启用复选框

```typescript
const engine = new TreeEngine({
  checkable: true,
  defaultCheckedKeys: ['1-1']  // 默认勾选北京
});
engine.init(rawData);
```

### 基本勾选操作

```typescript
// 切换勾选状态
const nodeIndex = engine.flatNodes.findIndex(n => n.id === '1');
engine.toggleCheck(nodeIndex);

// 设置勾选状态
engine.setChecked(nodeIndex, true);

// 全选
engine.checkAll();

// 取消全选
engine.uncheckAll();
```

### 获取勾选结果

```typescript
// 获取所有已勾选的节点 ID
console.log(engine.checkedSet);
// 输出: Set { '1', '1-1', '1-2', ... }

// 获取已勾选的叶子节点 ID（常用于表单提交）
const leafIds = engine.getCheckedLeafIDs();
console.log(leafIds);
// 输出: ['1-1', '1-2', '1-3-1', '1-3-2']

// 获取节点勾选状态
const checkState = engine.getCheckState(nodeIndex);
console.log(checkState);
// 输出: 'checked' | 'unchecked' | 'indeterminate'
```

### 严格模式（父子不联动）

```typescript
const engine = new TreeEngine({
  checkable: true,
  checkStrictly: true  // 父子勾选不联动
});
engine.init(rawData);

// 此时勾选父节点不会自动勾选子节点
// 也不会有半选状态
```

### 监听勾选变化

```typescript
const unsubscribe = engine.subscribe(() => {
  console.log('勾选状态已变更');
  console.log('已选节点:', Array.from(engine.checkedSet));
  console.log('叶子节点:', engine.getCheckedLeafIDs());
});
```

---

## 搜索与过滤

### 内置搜索

```typescript
const engine = new TreeEngine({
  filterable: true
});
engine.init(rawData);

// 搜索关键词
engine.setSearch('深圳');

// 清除搜索
engine.clearFilter();

// 检查节点是否匹配
console.log(engine.isMatch('1-3-1')); // true
console.log(engine.isMatch('1-1'));   // false
```

### 自定义过滤函数

```typescript
// 按条件过滤
engine.setFilter((node) => {
  // 只显示层级大于 1 的节点
  return node.depth > 1;
});

// 组合条件
engine.setFilter((node) => {
  return node.depth > 0 && node.name.includes('广');
});

// 清除过滤
engine.setFilter(null);
```

### 使用 Web Worker 搜索（大数据量）

```typescript
import { SearchController, createSearchConfig } from '@light-cat/treekit-core';

// 创建搜索配置
const config = createSearchConfig({
  enableNavigation: true,   // 启用键盘导航
  enableLoop: true,         // 循环搜索
  showCount: true,          // 显示匹配数量
  debounceMs: 300           // 防抖延迟（毫秒）
});

// 创建控制器
const searchController = new SearchController({
  debounceMs: config.debounceMs,
  onResult: (result) => {
    // result: { matchIds: Set<string>, expandIds: Set<string> }
    engine.setMatchResult(result.matchIds, result.expandIds);
  }
});

// 初始化（传入原始数据）
searchController.init(rawData);

// 执行搜索
searchController.search('深圳');

// 清除搜索
searchController.clear();

// 清理资源
searchController.destroy();
```

### 搜索结果导航

```typescript
// 获取下一个匹配位置
const nextIndex = engine.navigateNext();
console.log(nextIndex); // 可见列表中的索引

// 从指定位置开始获取下一个
const nextFromIndex = engine.navigateNext(5);

// 获取上一个匹配位置
const prevIndex = engine.navigatePrev();

// 获取匹配数量
console.log(engine.matchCount);
```

---

## 虚拟列表

### VirtualListController

适用于大数据量的虚拟滚动场景：

```typescript
import { VirtualListController, calculateVisibleRange } from '@light-cat/treekit-core';

const controller = new VirtualListController({
  itemHeight: 32,    // 每项高度（像素）
  buffer: 5          // 缓冲区大小（上下各多渲染几项）
});

// 计算可见范围
function onScroll(scrollTop: number) {
  const containerHeight = 400;  // 容器高度
  const totalCount = engine.visibleCount;

  const { start, end } = calculateVisibleRange(
    scrollTop,
    containerHeight,
    totalCount,
    controller.itemHeight
  );

  // start 和 end 是可见项的索引范围
  console.log(`可见范围: ${start} - ${end}`);
}
```

### 手动创建控制器

```typescript
const state = {
  start: 0,
  end: 20,
  totalHeight: engine.visibleCount * 32
};

// 更新滚动位置
function handleScroll(event: Event) {
  const scrollTop = (event.target as HTMLElement).scrollTop;
  const { start, end } = controller.calculateVisibleRange(
    scrollTop,
    containerHeight,
    totalCount
  );

  state.start = start;
  state.end = end;
}
```

---

## 自定义字段映射

### 默认字段

```typescript
// 默认字段名
const rawNode = {
  id: '1',           // 节点唯一标识
  name: '中国',      // 显示名称
  parentId: null,    // 父节点 ID
  // children 字段是可选的，即使没有也会自动构建树结构
};
```

### 自定义字段名

```typescript
const engine = new TreeEngine({
  fieldMapper: {
    id: 'key',           // 自定义 ID 字段
    parentId: 'pid',     // 自定义父 ID 字段
    name: 'label',       // 自定义名称字段
    children: 'items'    // 自定义子节点字段（可选）
  }
});

// 使用自定义字段的数据
const customData = [
  { key: '1', label: '中国', pid: null },
  { key: '1-1', label: '北京', pid: '1' },
  { key: '1-2', label: '上海', pid: '1' },
];

engine.init(customData);
```

### 处理嵌套结构数据

```typescript
// 如果数据是嵌套结构，可以先转换为扁平格式
const nestedData = [
  {
    id: '1',
    name: '中国',
    children: [
      { id: '1-1', name: '北京' },
      { id: '1-2', name: '上海' }
    ]
  }
];

// 使用 children 字段映射
const engine = new TreeEngine({
  fieldMapper: {
    children: 'children'
  }
});

// 需要先展平嵌套数据
function flattenNested(nodes: any[], mapper: FieldMapper): RawNode[] {
  const result: RawNode[] = [];
  const idField = mapper.id || 'id';
  const parentIdField = mapper.parentId || 'parentId';
  const nameField = mapper.name || 'name';
  const childrenField = mapper.children || 'children';

  function traverse(items: any[], parentId: string | null) {
    for (const item of items) {
      result.push({
        id: item[idField],
        name: item[nameField],
        parentId
      });
      if (item[childrenField]) {
        traverse(item[childrenField], item[idField]);
      }
    }
  }

  traverse(nodes, null);
  return result;
}

const flatData = flattenNested(nestedData, { children: 'children' });
engine.init(flatData);
```

---

## 与框架集成

### React

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { TreeEngine, type TreeNode } from '@light-cat/treekit-core';

interface TreeProps {
  data: RawNode[];
}

export function Tree({ data }: TreeProps) {
  const engineRef = useRef<TreeEngine | null>(null);
  const [visibleNodes, setVisibleNodes] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // 初始化引擎
  useEffect(() => {
    engineRef.current = new TreeEngine({
      checkable: true,
      defaultExpandedKeys: ['1']
    });

    const unsubscribe = engineRef.current.subscribe(() => {
      setVisibleNodes([...engineRef.current!.visibleList]);
      setExpandedKeys(new Set(engineRef.current!.expandedSet));
    });

    engineRef.current.init(data);

    return unsubscribe;
  }, [data]);

  // 展开/折叠
  const handleToggle = useCallback((nodeId: string) => {
    if (!engineRef.current) return;
    const node = engineRef.current.getNode(nodeId);
    if (!node) return;

    const index = engineRef.current.flatNodes.findIndex(n => n.id === nodeId);
    engineRef.current.toggle(index);
  }, []);

  return (
    <ul>
      {visibleNodes.map(node => (
        <li key={node.id} style={{ paddingLeft: node.depth * 20 }}>
          <button onClick={() => handleToggle(node.id)}>
            {expandedKeys.has(node.id) ? '▼' : '▶'}
          </button>
          {node.name}
        </li>
      ))}
    </ul>
  );
}
```

### Vue 3

```typescript
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { TreeEngine, type TreeNode } from '@light-cat/treekit-core';

const props = defineProps<{ data: RawNode[] }>();

const engine = new TreeEngine({ checkable: true });
const visibleNodes = ref<TreeNode[]>([]);
const expandedKeys = ref<Set<string>>(new Set());

let unsubscribe: (() => void) | null = null;

const updateState = () => {
  visibleNodes.value = [...engine.visibleList];
  expandedKeys.value = new Set(engine.expandedSet);
};

onMounted(() => {
  engine.init(props.data);
  unsubscribe = engine.subscribe(updateState);
  updateState();
});

onUnmounted(() => {
  unsubscribe?.();
});

watch(() => props.data, (newData) => {
  engine.init(newData);
}, { deep: true });

const handleToggle = (nodeId: string) => {
  const index = engine.flatNodes.findIndex(n => n.id === nodeId);
  engine.toggle(index);
};
</script>

<template>
  <ul>
    <li v-for="node in visibleNodes" :key="node.id" :style="{ paddingLeft: node.depth * 20 + 'px' }">
      <button @click="handleToggle(node.id)">
        {{ expandedKeys.has(node.id) ? '▼' : '▶' }}
      </button>
      {{ node.name }}
    </li>
  </ul>
</template>
```

### 纯原生 JavaScript

```typescript
import { TreeEngine } from '@light-cat/treekit-core';

// 创建引擎
const engine = new TreeEngine({ checkable: true });
engine.init(rawData);

// 订阅更新
const unsubscribe = engine.subscribe(() => {
  render();
});

// 渲染函数
function render() {
  const container = document.getElementById('tree');
  container.innerHTML = '';

  engine.visibleList.forEach(node => {
    const div = document.createElement('div');
    div.style.paddingLeft = node.depth * 20 + 'px';
    div.textContent = node.name;
    div.onclick = () => {
      const index = engine.flatNodes.findIndex(n => n.id === node.id);
      engine.toggle(index);
    };
    container.appendChild(div);
  });
}

// 清理
// unsubscribe();
```

---

## 性能优化

### 使用批量操作

```typescript
// 不使用批量操作 - 每次操作都会触发通知
engine.expandAll();    // 触发通知
engine.checkAll();     // 触发通知

// 使用批量操作 - 只触发一次通知
engine.batch(() => {
  engine.expandAll();
  engine.checkAll();
  engine.select('1-1');
});
```

### 避免重复查询

```typescript
// 低效：每次都查询
for (const node of engine.visibleList) {
  const status = engine.getNodeStatus(node.id);
  // ...
}

// 高效：批量获取
const statuses = engine.visibleList.map(node => ({
  node,
  status: engine.getNodeStatus(node.id)
}));
```

### 大数据量建议

1. **使用虚拟列表**：当节点数量超过 1000 时，建议配合虚拟列表使用
2. **Web Worker 搜索**：搜索大数据时使用 `SearchController` 进行异步搜索
3. **避免频繁订阅**：多个组件共享一个引擎实例时，使用派生状态而不是多个订阅
4. **使用只读属性**：通过 `flatNodes`、`visibleList` 等只读属性获取数据，避免深拷贝

```typescript
// 推荐：直接使用只读属性
const nodes = engine.visibleList;  // 返回 readonly 数组

// 不推荐：深拷贝数据
const nodes = [...engine.visibleList];  // 不必要的数据拷贝
```

### 节点查询优化

```typescript
// 使用 indexMap 进行 O(1) 查询
const node = engine.index.nodeMap.get('1-1');

// 使用 visibleIndexMap 进行可见列表查询
const visibleIndex = engine.visibleIndexMap.get('1-1');
```

---

## 完整示例

```typescript
import { TreeEngine, type RawNode } from '@light-cat/treekit-core';

// 模拟后端数据
const treeData: RawNode[] = [
  { id: '1', name: '根节点', parentId: null },
  { id: '1-1', name: '文档', parentId: '1' },
  { id: '1-1-1', name: '技术文档', parentId: '1-1' },
  { id: '1-1-2', name: '用户手册', parentId: '1-1' },
  { id: '1-2', name: '图片', parentId: '1' },
  { id: '1-2-1', name: '头像', parentId: '1-2' },
  { id: '1-2-2', name: '截图', parentId: '1-2' },
  { id: '2', name: '其他', parentId: null },
];

// 创建引擎
const engine = new TreeEngine({
  checkable: true,
  accordion: true,          // 手风琴模式
  defaultExpandedKeys: ['1']
});

engine.init(treeData);

// 监听变化
engine.subscribe(() => {
  console.log('节点数量:', engine.visibleCount);
  console.log('展开节点:', Array.from(engine.expandedSet));
  console.log('勾选节点:', Array.from(engine.checkedSet));
});

// 交互操作
function selectNode(nodeId: string) {
  engine.select(nodeId);
}

function toggleExpand(nodeId: string) {
  const index = engine.flatNodes.findIndex(n => n.id === nodeId);
  if (index >= 0) {
    engine.toggle(index);
  }
}

function toggleCheck(nodeId: string) {
  const index = engine.flatNodes.findIndex(n => n.id === nodeId);
  if (index >= 0) {
    engine.toggleCheck(index);
  }
}

function search(keyword: string) {
  engine.setSearch(keyword);
}

// 获取选中数据（用于提交）
function getSelectedData() {
  return {
    checkedLeafIds: engine.getCheckedLeafIDs(),
    selectedId: engine.selectedId,
    expandedIds: Array.from(engine.expandedSet)
  };
}
```
