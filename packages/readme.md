
## 总体原则（一句话版）

> **treekit-core 负责“什么是树、树现在是什么状态”**
> **treekit-svelte 负责“这些状态怎么被看到、怎么被操作”**

core 决定**真相**，UI 只是**投影**。

---

## 一、`@light-cat/treekit-core` —— 树语义与算法真源

### 1️⃣ 定位（不可动摇）

* 与任何 UI / 框架无关
* 纯 TypeScript 算法库
* Tree = 一维数据结果，不是组件

---

### 2️⃣ core 必须负责的事情

#### ✅ 树结构语义

* flatten 原始 tree
* depth / parentIndex / isLeaf 计算
* expanded 状态维护
* visibleIndex 计算

#### ✅ 行为语义（强制进 core）

**checkable**

* 父 → 子级联
* 子 → 父回溯
* 半选态（indeterminate）
* filter 后勾选语义保持一致

**filterable**

* 命中节点可见
* 命中节点祖先可见
* 非命中分支整体不可见
* 自动展开命中路径

**search（核心语义）**

* search 本质 = filter + 定位
* 命中集计算
* 可选暴露：

  * matchedIndices
  * firstMatchedIndex

> ⚠️ search 的“高亮”“滚动到可视区”不属于 core

---

### 3️⃣ core 明确不做的事（红线）

* ❌ UI 渲染
* ❌ DOM / HTML / CSS
* ❌ 行高 / 滚动 / viewport
* ❌ 虚拟滚动实现
* ❌ 搜索输入交互
* ❌ 视觉高亮样式

---

### 4️⃣ core 对外 API（示意）

```ts
TreeEngine {
  getState(): FlatNode[]
  subscribe(fn): unsubscribe

  toggle(index)
  setExpanded(index, boolean)

  setChecked(index, boolean)

  setFilter(fn | null)
  setSearch(keyword | null)
}
```

---

## 二、`@light-cat/treekit-svelte` —— UI 投影与交互层

### 1️⃣ 定位

* Svelte 专用 UI 包
* **不包含树算法**
* 只消费 treekit-core 的输出

---

### 2️⃣ svelte 包负责的事情

#### ✅ UI 渲染

* 一维 Row 列表渲染
* 缩进、箭头、checkbox、图标
* 样式主题 / slot / class

#### ✅ 用户交互绑定

* 点击展开 → `engine.toggle`
* 勾选 checkbox → `engine.setChecked`
* 输入搜索 → `engine.setSearch`

---

### 3️⃣ 虚拟化（UI 层专属）

**为什么在 svelte 而不是 core：**

* 依赖 DOM 尺寸
* 依赖 scrollTop
* 和框架生命周期绑定

svelte 包可以：

* 内置虚拟列表
* 或暴露 `virtual={true}` 配置
* 或允许用户自定义虚拟策略

---

### 4️⃣ search 的 UI 部分

core：

* 告诉你「哪些节点命中」

svelte：

* 高亮文本
* 滚动到第一个命中
* 上一个 / 下一个命中跳转

---

### 5️⃣ svelte 明确不做的事

* ❌ 递归 TreeNode 组件
* ❌ children 结构渲染
* ❌ 计算父子关系
* ❌ 自己实现 checkbox 级联
* ❌ 自己维护展开状态

---

## 三、职责对照表（直接给团队用）

| 能力                 | treekit-core | treekit-svelte |
| ------------------ | ------------ | -------------- |
| flatten            | ✅            | ❌              |
| parent / depth     | ✅            | ❌              |
| expanded 状态        | ✅            | ❌              |
| visibleIndex       | ✅            | ❌              |
| checkbox 语义        | ✅            | ❌              |
| filter / search 逻辑 | ✅            | ❌              |
| 一维 rows 输出         | ✅            | ❌              |
| UI 渲染              | ❌            | ✅              |
| 虚拟化                | ❌            | ✅              |
| 滚动控制               | ❌            | ✅              |
| 搜索输入 / 高亮          | ❌            | ✅              |

---

## 四、你这个拆包设计的评价（实话）

这是**中大型前端组件库**才会走的路线，不是玩具方案：

* core 可以：

  * 复用到 React / Vue / CLI
  * 单测覆盖算法
* svelte 包：

  * 轻
  * 不背算法复杂度
  * 可快速迭代 UI

**唯一需要警惕的事：**

> 不要为了“用起来方便”，把树语义塞回 UI。

一旦破这个边界，整个设计就开始腐烂。

---

## 五、一句话定调（可以写进 README）

> **treekit-core 定义树的真相**
> **treekit-svelte 只是把真相画出来**
