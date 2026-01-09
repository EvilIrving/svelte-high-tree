<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { FlatNode, TreeIndex, CheckState } from '@light-cat/treekit-core';
  import TreeNode from './TreeNode.svelte';
  import { VirtualListController, getNodeCheckState, type VirtualListState } from './virtual-list';

  interface Props {
    visibleList: FlatNode[];
    flatNodes: FlatNode[];
    expandedSet: Set<string>;
    checkedSet: Set<string>;
    matchSet?: Set<string>;
    showCheckbox?: boolean;
    checkStrictly?: boolean;
    currentMatchId?: string | null;
    index: TreeIndex;
    itemHeight?: number;
    onToggleExpand: (nodeId: string) => void;
    onToggleCheck: (nodeId: string) => void;
  }

  let {
    visibleList,
    flatNodes,
    expandedSet,
    checkedSet,
    matchSet,
    showCheckbox = false,
    checkStrictly = false,
    currentMatchId = null,
    index,
    itemHeight = 32,
    onToggleExpand,
    onToggleCheck
  }: Props = $props();

  /**
   * 获取节点勾选状态（支持 checkStrictly 模式）
   */
  function getCheckStateForNode(node: FlatNode): CheckState {
    if (checkStrictly) {
      // 严格模式：只看自身是否在 checkedSet 中，无半选
      return checkedSet.has(node.id) ? 'checked' : 'unchecked';
    }
    return getNodeCheckState(node, flatNodes, checkedSet);
  }

  /**
   * 检查节点是否展开
   */
  function isNodeExpanded(nodeId: string): boolean {
    return expandedSet.has(nodeId);
  }

  // 虚拟列表状态
  let startIndex = $state(0);
  let endIndex = $state(50);
  let offsetTop = $state(0);

  // 渲染的节点切片
  let renderList = $derived(visibleList.slice(startIndex, endIndex));

  // 总高度
  let totalHeight = $derived(visibleList.length * itemHeight);

  // DOM 引用
  let containerRef: HTMLElement;
  let topSentinelRef: HTMLElement;
  let bottomSentinelRef: HTMLElement;

  let controller: VirtualListController | null = null;

  onMount(() => {
    controller = new VirtualListController({
      itemHeight,
      bufferSize: 10,
      onStateChange: (state: VirtualListState) => {
        startIndex = state.startIndex;
        endIndex = state.endIndex;
        offsetTop = state.offsetTop;
      }
    });

    controller.init(containerRef, topSentinelRef, bottomSentinelRef);
    controller.updateVisibleList(visibleList);
  });

  onDestroy(() => {
    controller?.destroy();
  });

  // 监听 visibleList 变化
  $effect(() => {
    controller?.updateVisibleList(visibleList);
  });

  /**
   * 滚动到指定节点
   */
  export function scrollToNode(nodeId: string) {
    controller?.scrollToNode(nodeId);
  }

  /**
   * 滚动到顶部
   */
  export function scrollToTop() {
    controller?.scrollToTop();
  }

  /**
   * 滚动到底部
   */
  export function scrollToBottom() {
    controller?.scrollToBottom();
  }
</script>

<div bind:this={containerRef} class="treekit-virtual">
  <!-- 占位容器，撑起总高度 -->
  <div class="treekit-virtual-spacer" style:height="{totalHeight}px">
    <!-- 顶部哨兵 -->
    <div
      bind:this={topSentinelRef}
      class="treekit-virtual-sentinel"
      style:top="{Math.max(0, offsetTop - 1)}px"
    ></div>

    <!-- 渲染区域 -->
    <div class="treekit-virtual-viewport" style:top="{offsetTop}px">
      {#each renderList as node (node.id)}
        <TreeNode
          {node}
          expanded={isNodeExpanded(node.id)}
          checkState={getCheckStateForNode(node)}
          {showCheckbox}
          isMatch={matchSet?.has(node.id)}
          isCurrent={currentMatchId === node.id}
          {itemHeight}
          onToggleExpand={() => onToggleExpand(node.id)}
          onToggleCheck={() => onToggleCheck(node.id)}
        />
      {/each}
    </div>

    <!-- 底部哨兵 -->
    <div
      bind:this={bottomSentinelRef}
      class="treekit-virtual-sentinel"
      style:top="{offsetTop + renderList.length * itemHeight}px"
    ></div>
  </div>
</div>
