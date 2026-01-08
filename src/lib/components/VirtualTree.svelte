<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { FlatNode, TreeIndex, VirtualListState } from '$lib/tree/types';
  import { VirtualListController } from '$lib/tree/virtual-list';
  import { getCheckState
    
   } from '$lib/tree/checkbox';
  import TreeNodeRow from './TreeNodeRow.svelte';

  interface Props {
    visibleList: FlatNode[];
    flatNodes: FlatNode[];
    expandedSet: Set<string>;
    checkedSet: Set<string>;
    searchMatchSet: Set<string>;
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
    searchMatchSet,
    currentMatchId = null,
    index,
    itemHeight = 32,
    onToggleExpand,
    onToggleCheck
  }: Props = $props();

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
   * 获取节点的勾选状态
   */
  function getNodeCheckState(node: FlatNode) {
    return getCheckState(node, flatNodes, checkedSet);
  }

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

<div bind:this={containerRef} class="virtual-tree-container">
  <!-- 占位容器，撑起总高度 -->
  <div class="virtual-tree-spacer" style="height: {totalHeight}px;">
    <!-- 顶部哨兵 -->
    <div
      bind:this={topSentinelRef}
      class="sentinel sentinel-top"
      style="top: {Math.max(0, offsetTop - 1)}px;"
    ></div>

    <!-- 渲染区域 -->
    <div class="virtual-tree-viewport" style="top: {offsetTop}px;">
      {#each renderList as node (node.id)}
        <TreeNodeRow
          {node}
          isExpanded={expandedSet.has(node.id)}
          checkState={getNodeCheckState(node)}
          isSearchMatch={searchMatchSet.has(node.id)}
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
      class="sentinel sentinel-bottom"
      style="top: {offsetTop + renderList.length * itemHeight}px;"
    ></div>
  </div>
</div>

<style>
  .virtual-tree-container {
    height: 100%;
    overflow: auto;
    position: relative;
  }

  .virtual-tree-spacer {
    position: relative;
    min-height: 100%;
  }

  .virtual-tree-viewport {
    position: absolute;
    width: 100%;
    left: 0;
  }

  .sentinel {
    position: absolute;
    height: 1px;
    width: 100%;
    pointer-events: none;
  }
</style>
