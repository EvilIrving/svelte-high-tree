<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { FlatDisplayNode, DisplayTreeIndex, VirtualListState } from '$lib/file-tree/types';
  import { VirtualListController } from '$lib/file-tree/virtual-list';
  import FileNodeRow from './FileNodeRow.svelte';

  interface Props {
    visibleList: FlatDisplayNode[];
    flatNodes: FlatDisplayNode[];
    expandedSet: Set<string>;
    selectedId: string | null;
    index: DisplayTreeIndex;
    itemHeight?: number;
    onToggleExpand: (nodeId: string) => void;
    onSelect: (nodeId: string) => void;
  }

  let {
    visibleList,
    flatNodes,
    expandedSet,
    selectedId,
    index,
    itemHeight = 32,
    onToggleExpand,
    onSelect
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

<div bind:this={containerRef} class="file-tree-container">
  <!-- 占位容器，撑起总高度 -->
  <div class="file-tree-spacer">
    <!-- 顶部哨兵 -->
    <div
      bind:this={topSentinelRef}
      class="sentinel sentinel-top"
      style="top: {Math.max(0, offsetTop - 1)}px;"
    ></div>

    <!-- 渲染区域 -->
    <div class="file-tree-viewport" style="top: {offsetTop}px;">
      {#each renderList as node (node.id)}
        <FileNodeRow
          {node}
          isExpanded={expandedSet.has(node.id)}
          isSelected={selectedId === node.id}
          {itemHeight}
          onToggleExpand={() => onToggleExpand(node.id)}
          onSelect={() => onSelect(node.id)}
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
  .file-tree-container {
    height: 100%;
    overflow: auto;
    position: relative;
    background: #fafafa;
  }

  .file-tree-spacer {
    position: relative;
    min-height: 100%;
  }

  .file-tree-viewport {
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
