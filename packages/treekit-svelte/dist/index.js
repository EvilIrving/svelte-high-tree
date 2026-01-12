// src/createTree.svelte.ts
import { TreeEngine } from "@light-cat/treekit-core";
import { SvelteSet } from "svelte/reactivity";
function createTree(nodes, options) {
  const engine = new TreeEngine(options);
  let flatNodes = $state.raw([]);
  let totalCount = $state.raw(0);
  let visibleList = $state.raw([]);
  let visibleCount = $state.raw(0);
  let checkedCount = $state.raw(0);
  let matchCount = $state.raw(0);
  let selectedId = $state.raw(null);
  const checkedSet = new SvelteSet();
  const expandedSet = new SvelteSet();
  const matchSet = new SvelteSet();
  const syncState = () => {
    flatNodes = engine.flatNodes;
    totalCount = engine.totalCount;
    visibleList = engine.visibleList;
    visibleCount = engine.visibleCount;
    checkedCount = engine.checkedCount;
    matchCount = engine.matchCount;
    selectedId = engine.selectedId;
    syncSet(checkedSet, engine.checkedSet);
    syncSet(expandedSet, engine.expandedSet);
    syncSet(matchSet, engine.matchSet);
  };
  function syncSet(svelteSet, sourceSet) {
    if (svelteSet.size !== sourceSet.size || [...svelteSet].some((v) => !sourceSet.has(v))) {
      svelteSet.clear();
      sourceSet.forEach((v) => svelteSet.add(v));
    }
  }
  const unsubscribe = engine.subscribe(() => {
    syncState();
  });
  if (nodes && nodes.length > 0) {
    engine.init(nodes);
  }
  return {
    // 原始数据
    get flatNodes() {
      return flatNodes;
    },
    get visibleList() {
      return visibleList;
    },
    // 统计
    get totalCount() {
      return totalCount;
    },
    get visibleCount() {
      return visibleCount;
    },
    get checkedCount() {
      return checkedCount;
    },
    get matchCount() {
      return matchCount;
    },
    get selectedId() {
      return selectedId;
    },
    // 索引
    get index() {
      return engine.index;
    },
    // 状态集（使用同步后的响应式状态）
    get expandedSet() {
      return expandedSet;
    },
    get checkedSet() {
      return checkedSet;
    },
    get matchSet() {
      return matchSet;
    },
    // 初始化
    init(rawNodes) {
      engine.init(rawNodes);
    },
    setOptions(options2) {
      engine.setOptions(options2);
    },
    // 节点操作（接受 visibleIndex）
    toggle(visibleIndex) {
      const flatIndex = engine.getFlatIndexByVisibleIndex(visibleIndex);
      if (flatIndex >= 0) engine.toggle(flatIndex);
    },
    setExpanded(visibleIndex, value) {
      const flatIndex = engine.getFlatIndexByVisibleIndex(visibleIndex);
      if (flatIndex >= 0) engine.setExpanded(flatIndex, value);
    },
    setChecked(visibleIndex, value) {
      const flatIndex = engine.getFlatIndexByVisibleIndex(visibleIndex);
      if (flatIndex >= 0) engine.setChecked(flatIndex, value);
    },
    toggleCheck(visibleIndex) {
      const flatIndex = engine.getFlatIndexByVisibleIndex(visibleIndex);
      if (flatIndex >= 0) engine.toggleCheck(flatIndex);
    },
    /** 直接通过 nodeId 切换勾选状态 */
    toggleCheckById(nodeId) {
      const flatIndex = engine.index.indexMap.get(nodeId);
      if (flatIndex != null) {
        engine.toggleCheck(flatIndex);
      }
    },
    // 批量操作
    expandAll() {
      engine.expandAll();
    },
    collapseAll() {
      engine.collapseAll();
    },
    expandToDepth(depth) {
      engine.expandToDepth(depth);
    },
    setExpandedSet(newSet) {
      engine.setExpandedSet(newSet);
    },
    checkAll() {
      engine.checkAll();
    },
    uncheckAll() {
      engine.uncheckAll();
    },
    // 过滤/搜索
    setFilter(predicate) {
      engine.setFilter(predicate);
    },
    setSearch(query) {
      engine.setSearch(query);
    },
    clearFilter() {
      engine.clearFilter();
    },
    /** 直接设置搜索匹配结果（用于异步搜索，如 Web Worker） */
    setMatchResult(matchIds, expandIds) {
      engine.setMatchResult(matchIds, expandIds);
    },
    isMatch(nodeId) {
      return engine.isMatch(nodeId);
    },
    // 导航
    navigateNext(fromVisibleIndex) {
      return engine.navigateNext(fromVisibleIndex);
    },
    navigatePrev(fromVisibleIndex) {
      return engine.navigatePrev(fromVisibleIndex);
    },
    // 查询
    getNode(nodeId) {
      return engine.getNode(nodeId);
    },
    getNodeStatus(nodeId) {
      return engine.getNodeStatus(nodeId);
    },
    getCheckState(visibleIndex) {
      const flatIndex = engine.getFlatIndexByVisibleIndex(visibleIndex);
      if (flatIndex < 0) return "unchecked";
      return engine.getCheckState(flatIndex);
    },
    getCheckStateByNodeId(nodeId) {
      return engine.getCheckStateByNodeId(nodeId);
    },
    getCheckedLeafIDs() {
      return engine.getCheckedLeafIDs();
    },
    getVisibleIndex(nodeId) {
      return engine.getVisibleIndex(nodeId);
    },
    // 选中操作（单选）
    select(nodeId) {
      engine.select(nodeId);
    },
    clearSelection() {
      engine.clearSelection();
    },
    // 展开到指定节点
    expandToNode(nodeId) {
      engine.expandToNode(nodeId);
    },
    // 销毁
    destroy() {
      unsubscribe();
    },
    // 事务模式
    startBatch() {
      engine.startBatch();
    },
    commit() {
      engine.commit();
    },
    batch(fn) {
      engine.batch(fn);
    }
  };
}

// src/Tree.svelte
import "svelte/internal/disclose-version";
import * as $3 from "svelte/internal/client";
import { onMount as onMount2, onDestroy as onDestroy2 } from "svelte";
import { expandMultiple } from "@light-cat/treekit-core";

// src/VirtualTree.svelte
import "svelte/internal/disclose-version";
import * as $2 from "svelte/internal/client";
import { onMount, onDestroy } from "svelte";

// src/TreeNode.svelte
import "svelte/internal/disclose-version";
import * as $ from "svelte/internal/client";
var root_1 = $.from_svg(`<svg class="treekit-expand-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg>`);
var root_2 = $.from_html(`<span class="treekit-spacer"></span>`);
var root_3 = $.from_html(`<label class="treekit-checkbox-wrapper"><input class="treekit-checkbox-input" type="checkbox" tabindex="-1"/> <span></span></label>`);
var root = $.from_html(`<div><button type="button"><!></button> <!> <span class="treekit-label"> </span></div>`);
function TreeNode($$anchor, $$props) {
  $.push($$props, true);
  let showCheckbox = $.prop($$props, "showCheckbox", 3, false), isMatch = $.prop($$props, "isMatch", 3, false), isCurrent = $.prop($$props, "isCurrent", 3, false), isSelected = $.prop($$props, "isSelected", 3, false), itemHeight = $.prop($$props, "itemHeight", 3, 32), indentSize = $.prop($$props, "indentSize", 3, 20), className = $.prop($$props, "class", 3, "");
  let indent = $.derived(() => $$props.node.depth * indentSize() + (showCheckbox() ? 0 : 20));
  var div = root();
  let classes;
  let styles;
  var button = $.child(div);
  let classes_1;
  button.__click = (e) => {
    e.stopPropagation();
    $$props.onToggleExpand?.();
  };
  var node_1 = $.child(button);
  {
    var consequent = ($$anchor2) => {
      var svg = root_1();
      $.append($$anchor2, svg);
    };
    var alternate = ($$anchor2) => {
      var span = root_2();
      $.append($$anchor2, span);
    };
    $.if(node_1, ($$render) => {
      if ($$props.node.hasChildren) $$render(consequent);
      else $$render(alternate, false);
    });
  }
  $.reset(button);
  var node_2 = $.sibling(button, 2);
  {
    var consequent_1 = ($$anchor2) => {
      var label = root_3();
      var input = $.child(label);
      input.__click = (e) => e.stopPropagation();
      input.__change = (e) => {
        e.stopPropagation();
        $$props.onToggleCheck?.();
      };
      var span_1 = $.sibling(input, 2);
      let classes_2;
      $.reset(label);
      $.template_effect(() => classes_2 = $.set_class(span_1, 1, "treekit-checkbox-visual", null, classes_2, {
        "treekit-checkbox-visual--checked": $$props.checkState === "checked",
        "treekit-checkbox-visual--indeterminate": $$props.checkState === "indeterminate"
      }));
      $.append($$anchor2, label);
    };
    $.if(node_2, ($$render) => {
      if (showCheckbox()) $$render(consequent_1);
    });
  }
  var span_2 = $.sibling(node_2, 2);
  span_2.__click = (e) => {
    e.stopPropagation();
    $$props.onNodeClick?.();
  };
  var text = $.child(span_2, true);
  $.reset(span_2);
  $.reset(div);
  $.template_effect(() => {
    classes = $.set_class(div, 1, `treekit-node ${className() ?? ""}`, null, classes, {
      "treekit-node--match": isMatch(),
      "treekit-node--current": isCurrent(),
      "treekit-node--selected": isSelected(),
      "treekit-node--has-children": $$props.node.hasChildren
    });
    $.set_attribute(div, "data-expanded", $$props.expanded);
    $.set_attribute(div, "data-checkstate", $$props.checkState);
    $.set_attribute(div, "data-match", isMatch());
    $.set_attribute(div, "data-current", isCurrent());
    $.set_attribute(div, "data-selected", isSelected());
    $.set_attribute(div, "data-id", $$props.node.id);
    styles = $.set_style(div, "", styles, {
      height: `${itemHeight() ?? ""}px`,
      "padding-left": `${$.get(indent) ?? ""}px`
    });
    classes_1 = $.set_class(button, 1, "treekit-expand", null, classes_1, {
      "treekit-expand--expanded": $$props.expanded,
      "treekit-expand--has-children": $$props.node.hasChildren
    });
    button.disabled = !$$props.node.hasChildren;
    $.set_attribute(button, "aria-label", $$props.expanded ? "Collapse" : "Expand");
    $.set_attribute(span_2, "title", $$props.node.name);
    $.set_text(text, $$props.node.name);
  });
  $.append($$anchor, div);
  $.pop();
}
$.delegate(["click", "change"]);

// src/VirtualTree.svelte
import { VirtualListController, getNodeCheckState } from "@light-cat/treekit-core";
var root2 = $2.from_html(`<div class="treekit-virtual"><div class="treekit-virtual-spacer"><div class="treekit-virtual-sentinel"></div> <div class="treekit-virtual-viewport"></div> <div class="treekit-virtual-sentinel"></div></div></div>`);
function VirtualTree($$anchor, $$props) {
  $2.push($$props, true);
  let showCheckbox = $2.prop($$props, "showCheckbox", 3, false), checkStrictly = $2.prop($$props, "checkStrictly", 3, false), currentMatchId = $2.prop($$props, "currentMatchId", 3, null), selectedId = $2.prop($$props, "selectedId", 3, null), itemHeight = $2.prop($$props, "itemHeight", 3, 32);
  function getCheckStateForNode(node) {
    if (checkStrictly()) {
      return $$props.checkedSet.has(node.id) ? "checked" : "unchecked";
    }
    return getNodeCheckState(node, $$props.flatNodes, $$props.checkedSet);
  }
  function isNodeExpanded(nodeId) {
    return $$props.expandedSet.has(nodeId);
  }
  let startIndex = $2.state(0);
  let endIndex = $2.state(50);
  let offsetTop = $2.state(0);
  let renderList = $2.derived(() => $$props.visibleList.slice($2.get(startIndex), $2.get(endIndex)));
  let totalHeight = $2.derived(() => $$props.visibleList.length * itemHeight());
  let containerRef;
  let topSentinelRef;
  let bottomSentinelRef;
  let controller = null;
  onMount(() => {
    controller = new VirtualListController({
      itemHeight: itemHeight(),
      bufferSize: 10,
      onStateChange: (state2) => {
        $2.set(startIndex, state2.startIndex, true);
        $2.set(endIndex, state2.endIndex, true);
        $2.set(offsetTop, state2.offsetTop, true);
      }
    });
    controller.init(containerRef, topSentinelRef, bottomSentinelRef);
    controller.setFindIndexById((nodeId) => $$props.visibleList.findIndex((n) => n.id === nodeId));
    controller.updateVisibleList($$props.visibleList);
  });
  onDestroy(() => {
    controller?.destroy();
  });
  $2.user_effect(() => {
    controller?.updateVisibleList($$props.visibleList);
  });
  function scrollToNode(nodeId) {
    controller?.scrollToNode(nodeId);
  }
  function scrollToTop() {
    controller?.scrollToTop();
  }
  function scrollToBottom() {
    controller?.scrollToBottom();
  }
  var $$exports = { scrollToNode, scrollToTop, scrollToBottom };
  var div = root2();
  var div_1 = $2.child(div);
  let styles;
  var div_2 = $2.child(div_1);
  let styles_1;
  $2.bind_this(div_2, ($$value) => topSentinelRef = $$value, () => topSentinelRef);
  var div_3 = $2.sibling(div_2, 2);
  let styles_2;
  $2.each(div_3, 21, () => $2.get(renderList), (node) => node.id, ($$anchor2, node) => {
    {
      let $0 = $2.derived(() => isNodeExpanded($2.get(node).id));
      let $1 = $2.derived(() => getCheckStateForNode($2.get(node)));
      let $22 = $2.derived(() => $$props.matchSet?.has($2.get(node).id));
      let $32 = $2.derived(() => currentMatchId() === $2.get(node).id);
      let $4 = $2.derived(() => selectedId() === $2.get(node).id);
      TreeNode($$anchor2, {
        get node() {
          return $2.get(node);
        },
        get expanded() {
          return $2.get($0);
        },
        get checkState() {
          return $2.get($1);
        },
        get showCheckbox() {
          return showCheckbox();
        },
        get isMatch() {
          return $2.get($22);
        },
        get isCurrent() {
          return $2.get($32);
        },
        get isSelected() {
          return $2.get($4);
        },
        get itemHeight() {
          return itemHeight();
        },
        onToggleExpand: () => $$props.onToggleExpand($2.get(node).id),
        onToggleCheck: () => $$props.onToggleCheck($2.get(node).id),
        onNodeClick: () => $$props.onNodeClick($2.get(node).id)
      });
    }
  });
  $2.reset(div_3);
  var div_4 = $2.sibling(div_3, 2);
  let styles_3;
  $2.bind_this(div_4, ($$value) => bottomSentinelRef = $$value, () => bottomSentinelRef);
  $2.reset(div_1);
  $2.reset(div);
  $2.bind_this(div, ($$value) => containerRef = $$value, () => containerRef);
  $2.template_effect(
    ($0) => {
      styles = $2.set_style(div_1, "", styles, { height: `${$2.get(totalHeight) ?? ""}px` });
      styles_1 = $2.set_style(div_2, "", styles_1, $0);
      styles_2 = $2.set_style(div_3, "", styles_2, { top: `${$2.get(offsetTop) ?? ""}px` });
      styles_3 = $2.set_style(div_4, "", styles_3, {
        top: `${$2.get(offsetTop) + $2.get(renderList).length * itemHeight()}px`
      });
    },
    [() => ({ top: `${Math.max(0, $2.get(offsetTop) - 1)}px` })]
  );
  $2.append($$anchor, div);
  return $2.pop($$exports);
}

// src/Tree.svelte
import { SearchController } from "@light-cat/treekit-core";

// src/search-navigator.svelte.ts
import { getAncestorSet } from "@light-cat/treekit-core";
var SearchNavigator = class {
  constructor(config) {
    this.flatNodes = [];
    this.index = null;
    // ========== 响应式状态 ==========
    this._matchList = $state.raw([]);
    // 按 flatNodes 顺序的匹配 ID 列表
    this._currentIndex = $state(-1);
    this.config = config;
  }
  // ========== 访问器 ==========
  /** 当前索引 */
  get currentIndex() {
    return this._currentIndex;
  }
  /** 匹配列表 */
  get matchList() {
    return this._matchList;
  }
  /** 当前聚焦的节点 ID */
  get currentId() {
    return this._currentIndex >= 0 && this._currentIndex < this._matchList.length ? this._matchList[this._currentIndex] : null;
  }
  /** 匹配总数（仅 showCount 开启时有值） */
  get total() {
    return this.config.showCount ? this._matchList.length : void 0;
  }
  /** 当前位置（1-based，仅 showCount 开启且有匹配时有值） */
  get current() {
    return this.config.showCount && this._currentIndex >= 0 ? this._currentIndex + 1 : void 0;
  }
  /** 是否有匹配结果 */
  get hasMatches() {
    return this._matchList.length > 0;
  }
  /**
   * 初始化数据源
   * 只有 enableNavigation 为 true 时才需要调用
   */
  init(flatNodes, index) {
    if (!this.config.enableNavigation) return;
    this.flatNodes = flatNodes;
    this.index = index;
  }
  /**
   * 更新匹配列表
   * 按 flatNodes 顺序排列匹配 ID，并默认选中第一个
   */
  updateMatches(matchIds) {
    if (!this.config.enableNavigation) {
      return { id: null, expandIds: /* @__PURE__ */ new Set(), success: false };
    }
    this._matchList = this.flatNodes.filter((n) => matchIds.has(n.id)).map((n) => n.id);
    this._currentIndex = this._matchList.length > 0 ? 0 : -1;
    return this.getCurrentWithAncestors(true);
  }
  /**
   * 跳转到下一个匹配项
   * @returns NavigateResult，success 为 false 表示已到最后一个且不循环
   */
  next() {
    if (!this.config.enableNavigation || this._matchList.length === 0) {
      return { id: null, expandIds: /* @__PURE__ */ new Set(), success: false };
    }
    if (this._currentIndex < this._matchList.length - 1) {
      this._currentIndex++;
      return this.getCurrentWithAncestors(true);
    }
    if (this.config.enableLoop) {
      this._currentIndex = 0;
      return this.getCurrentWithAncestors(true);
    }
    return this.getCurrentWithAncestors(false);
  }
  /**
   * 跳转到上一个匹配项
   * @returns NavigateResult，success 为 false 表示已到第一个且不循环
   */
  prev() {
    if (!this.config.enableNavigation || this._matchList.length === 0) {
      return { id: null, expandIds: /* @__PURE__ */ new Set(), success: false };
    }
    if (this._currentIndex > 0) {
      this._currentIndex--;
      return this.getCurrentWithAncestors(true);
    }
    if (this.config.enableLoop) {
      this._currentIndex = this._matchList.length - 1;
      return this.getCurrentWithAncestors(true);
    }
    return this.getCurrentWithAncestors(false);
  }
  /**
   * 跳转到指定索引
   */
  goTo(index) {
    if (!this.config.enableNavigation || this._matchList.length === 0) {
      return { id: null, expandIds: /* @__PURE__ */ new Set(), success: false };
    }
    if (index >= 0 && index < this._matchList.length) {
      this._currentIndex = index;
      return this.getCurrentWithAncestors(true);
    }
    return { id: null, expandIds: /* @__PURE__ */ new Set(), success: false };
  }
  /**
   * 重置导航状态
   */
  reset() {
    this._matchList = [];
    this._currentIndex = -1;
  }
  /**
   * 获取当前节点及其祖先
   */
  getCurrentWithAncestors(success) {
    const id = this.currentId;
    if (!id) {
      return { id: null, expandIds: /* @__PURE__ */ new Set(), success: false };
    }
    const expandIds = this.collectAncestorIds(id);
    return { id, expandIds, success };
  }
  /**
   * 收集节点的所有祖先 ID
   */
  collectAncestorIds(nodeId) {
    if (!this.index) return /* @__PURE__ */ new Set();
    return getAncestorSet(nodeId, this.index.nodeMap);
  }
};
function createSearchNavigator(config) {
  return new SearchNavigator(config);
}

// src/Tree.svelte
import { createSearchConfig } from "@light-cat/treekit-core";
var root3 = $3.from_html(`<div><!></div>`);
function Tree($$anchor, $$props) {
  $3.push($$props, true);
  let checkable = $3.prop($$props, "checkable", 3, false), checkStrictly = $3.prop($$props, "checkStrictly", 3, false), defaultCheckedKeys = $3.prop($$props, "defaultCheckedKeys", 19, () => []), defaultExpandedKeys = $3.prop($$props, "defaultExpandedKeys", 19, () => []), defaultSelectedKeys = $3.prop($$props, "defaultSelectedKeys", 19, () => []), selectable = $3.prop($$props, "selectable", 3, true), searchable = $3.prop($$props, "searchable", 3, false), itemHeight = $3.prop($$props, "itemHeight", 3, 32), className = $3.prop($$props, "class", 3, "");
  const tree = createTree($$props.treeData, {
    checkable: checkable(),
    checkStrictly: checkStrictly(),
    defaultCheckedKeys: defaultCheckedKeys(),
    defaultExpandedKeys: defaultExpandedKeys(),
    defaultSelectedKeys: defaultSelectedKeys(),
    fieldMapper: $$props.fieldMapper
  });
  let virtualTreeRef;
  const searchConfig = createSearchConfig({ enableNavigation: true, enableLoop: true, showCount: true });
  let searchController = null;
  const searchNavigator = new SearchNavigator(searchConfig);
  let currentSearchKeyword = "";
  onMount2(() => {
    if (searchable()) {
      searchController = new SearchController({
        debounceMs: searchConfig.debounceMs,
        onResult: (result) => {
          tree.setMatchResult(result.matchIds, result.expandIds);
          const navResult = searchNavigator.updateMatches(result.matchIds);
          if (navResult.id) {
            requestAnimationFrame(() => {
              virtualTreeRef?.scrollToNode(navResult.id);
            });
          }
        }
      });
      searchController.init($$props.treeData);
      searchNavigator.init(tree.flatNodes, tree.index);
    }
  });
  function handleToggleExpand(nodeId) {
    const node = tree.index.nodeMap.get(nodeId);
    if (!node) return;
    const wasExpanded = tree.expandedSet.has(nodeId);
    const visibleIndex = tree.getVisibleIndex(nodeId);
    if (visibleIndex >= 0) {
      tree.toggle(visibleIndex);
    }
    $$props.onExpand?.(Array.from(tree.expandedSet), { node, expanded: !wasExpanded });
  }
  function handleToggleCheck(nodeId) {
    const node = tree.index.nodeMap.get(nodeId);
    if (!node) return;
    const wasChecked = tree.checkedSet.has(nodeId);
    tree.toggleCheckById(nodeId);
    $$props.onCheck?.(Array.from(tree.checkedSet), { node, checked: !wasChecked });
  }
  let clickTimer = null;
  function handleNodeClick(nodeId) {
    if (!selectable()) return;
    const node = tree.index.nodeMap.get(nodeId);
    if (!node) return;
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      if (node.hasChildren) {
        const visibleIndex = tree.getVisibleIndex(nodeId);
        if (visibleIndex >= 0) {
          const wasExpanded = tree.expandedSet.has(nodeId);
          tree.toggle(visibleIndex);
          $$props.onExpand?.(Array.from(tree.expandedSet), { node, expanded: !wasExpanded });
        }
      }
    } else {
      clickTimer = setTimeout(
        () => {
          clickTimer = null;
          const wasSelected = tree.selectedId === nodeId;
          if (wasSelected) {
            tree.clearSelection();
          } else {
            tree.select(nodeId);
          }
          $$props.onSelect?.(tree.selectedId ? [tree.selectedId] : [], { node, selected: !wasSelected });
        },
        300
      );
    }
  }
  function expandAll() {
    tree.expandAll();
  }
  function collapseAll() {
    tree.collapseAll();
  }
  function expandToDepth(depth) {
    tree.expandToDepth(depth);
  }
  function checkAll() {
    tree.checkAll();
  }
  function uncheckAll() {
    tree.uncheckAll();
  }
  function scrollToNode(nodeId) {
    virtualTreeRef?.scrollToNode(nodeId);
  }
  function getCheckedLeafKeys() {
    return tree.getCheckedLeafIDs();
  }
  function getCheckedKeys() {
    return Array.from(tree.checkedSet);
  }
  function getSelectedKey() {
    return tree.selectedId;
  }
  function search(keyword) {
    if (!searchable() || !searchController) return;
    currentSearchKeyword = keyword;
    if (keyword.trim() === "") {
      tree.clearFilter();
      searchNavigator.reset();
    } else {
      searchController.search(keyword);
    }
  }
  function clearSearch() {
    if (!searchable()) return;
    currentSearchKeyword = "";
    tree.clearFilter();
    searchController?.clear();
    searchNavigator.reset();
  }
  function nextMatch() {
    if (!searchable()) return;
    const result = searchNavigator.next();
    if (result.id) {
      tree.setExpandedSet(expandMultiple(new Set(result.expandIds), new Set(tree.expandedSet)));
      requestAnimationFrame(() => {
        virtualTreeRef?.scrollToNode(result.id);
      });
    }
  }
  function prevMatch() {
    if (!searchable()) return;
    const result = searchNavigator.prev();
    if (result.id) {
      tree.setExpandedSet(expandMultiple(new Set(result.expandIds), new Set(tree.expandedSet)));
      requestAnimationFrame(() => {
        virtualTreeRef?.scrollToNode(result.id);
      });
    }
  }
  function getSearchState() {
    return {
      hasMatches: searchNavigator.hasMatches,
      current: searchNavigator.current ?? 0,
      total: searchNavigator.total ?? 0,
      currentId: searchNavigator.currentId
    };
  }
  function getStats() {
    return {
      totalCount: tree.totalCount,
      visibleCount: tree.visibleCount,
      checkedCount: tree.checkedCount,
      expandedCount: tree.expandedSet.size
    };
  }
  onDestroy2(() => {
    searchController?.destroy();
    tree.destroy();
  });
  var $$exports = {
    expandAll,
    collapseAll,
    expandToDepth,
    checkAll,
    uncheckAll,
    scrollToNode,
    getCheckedLeafKeys,
    getCheckedKeys,
    getSelectedKey,
    search,
    clearSearch,
    nextMatch,
    prevMatch,
    getSearchState,
    getStats
  };
  var div = root3();
  var node_1 = $3.child(div);
  $3.bind_this(
    VirtualTree(node_1, {
      get visibleList() {
        return tree.visibleList;
      },
      get flatNodes() {
        return tree.flatNodes;
      },
      get expandedSet() {
        return tree.expandedSet;
      },
      get checkedSet() {
        return tree.checkedSet;
      },
      get matchSet() {
        return tree.matchSet;
      },
      get showCheckbox() {
        return checkable();
      },
      get checkStrictly() {
        return checkStrictly();
      },
      get currentMatchId() {
        return searchNavigator.currentId;
      },
      get selectedId() {
        return tree.selectedId;
      },
      get index() {
        return tree.index;
      },
      get itemHeight() {
        return itemHeight();
      },
      onToggleExpand: handleToggleExpand,
      onToggleCheck: handleToggleCheck,
      onNodeClick: handleNodeClick
    }),
    ($$value) => virtualTreeRef = $$value,
    () => virtualTreeRef
  );
  $3.reset(div);
  $3.template_effect(() => $3.set_class(div, 1, `treekit-tree ${className() ?? ""}`, "svelte-1l8c7yj"));
  $3.append($$anchor, div);
  return $3.pop($$exports);
}

// src/index.ts
import { SearchController as SearchController2, searchSync } from "@light-cat/treekit-core";
import { DEFAULT_SEARCH_CONFIG, createSearchConfig as createSearchConfig2 } from "@light-cat/treekit-core";
import { VirtualListController as VirtualListController2, calculateVisibleRange, getNodeCheckState as getNodeCheckState2 } from "@light-cat/treekit-core";
export {
  DEFAULT_SEARCH_CONFIG,
  SearchController2 as SearchController,
  SearchNavigator,
  Tree,
  TreeNode,
  VirtualListController2 as VirtualListController,
  VirtualTree,
  calculateVisibleRange,
  createSearchConfig2 as createSearchConfig,
  createSearchNavigator,
  createTree,
  getNodeCheckState2 as getNodeCheckState,
  searchSync
};
