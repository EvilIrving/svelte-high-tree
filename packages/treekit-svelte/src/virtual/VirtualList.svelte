<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { VirtualListController, type VirtualListState } from '@light-cat/treekit-core';
  import type { Snippet } from 'svelte';

  interface Props<T extends { id: string }> {
    items: T[];
    itemHeight?: number;
    bufferSize?: number;
    children: Snippet<[T]>;
  }

  let {
    items,
    itemHeight = 32,
    bufferSize = 10,
    children
  }: Props<any> = $props();

  // 内部响应式状态
  let startIndex = $state(0);
  let endIndex = $state(50);
  let offsetTop = $state(0);

  // DOM 引用
  let containerRef: HTMLElement;
  let topSentinelRef: HTMLElement;
  let bottomSentinelRef: HTMLElement;

  let controller: VirtualListController | null = null;

  onMount(() => {
    controller = new VirtualListController({
      itemHeight,
      bufferSize,
      onStateChange: (state: VirtualListState) => {
        startIndex = state.startIndex;
        endIndex = state.endIndex;
        offsetTop = state.offsetTop;
      }
    });

    controller.init(containerRef, topSentinelRef, bottomSentinelRef);
    controller.setFindIndexById((id: string) => items.findIndex((item) => item.id === id));
    controller.updateVisibleList(items);
  });

  onDestroy(() => {
    controller?.destroy();
  });

  // 监听列表变化
  $effect(() => {
    controller?.updateVisibleList(items);
  });

  // 计算派生状态
  let renderList = $derived(items.slice(startIndex, endIndex));
  let totalHeight = $derived(items.length * itemHeight);

  // 暴露 API 给外部
  export function scrollToNode(id: string) {
    controller?.scrollToNode(id);
  }

  export function scrollToIndex(index: number) {
    controller?.scrollToIndex(index);
  }

  export function scrollToTop() {
    controller?.scrollToTop();
  }

  export function scrollToBottom() {
    controller?.scrollToBottom();
  }
</script>

<div bind:this={containerRef} class="treekit-virtual-list">
  <div class="treekit-virtual-spacer" style:height="{totalHeight}px">
    <!-- 顶部哨兵（实现细节，对外隐藏） -->
    <div
      bind:this={topSentinelRef}
      class="treekit-sentinel"
      style:top="{Math.max(0, offsetTop - 1)}px"
    ></div>

    <!-- 渲染视图区域 -->
    <div class="treekit-viewport" style:top="{offsetTop}px">
      {#each renderList as item (item.id)}
        {@render children(item)}
      {/each}
    </div>

    <!-- 底部哨兵（实现细节，对外隐藏） -->
    <div
      bind:this={bottomSentinelRef}
      class="treekit-sentinel"
      style:top="{offsetTop + renderList.length * itemHeight}px"
    ></div>
  </div>
</div>

<style>
  .treekit-virtual-list {
    height: 100%;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    -webkit-overflow-scrolling: touch;
  }

  .treekit-virtual-spacer {
    position: relative;
    width: 100%;
  }

  .treekit-viewport {
    position: absolute;
    left: 0;
    right: 0;
    width: 100%;
    will-change: transform;
  }

  .treekit-sentinel {
    position: absolute;
    height: 1px;
    width: 1px;
    pointer-events: none;
    opacity: 0;
  }
</style>
