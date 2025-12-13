<script lang="ts">
  import type { FlatDisplayNode } from '$lib/file-tree/types';

  interface Props {
    node: FlatDisplayNode;
    isExpanded: boolean;
    isSelected: boolean;
    itemHeight: number;
    indentSize?: number;
    onToggleExpand: () => void;
    onSelect: () => void;
  }

  let {
    node,
    isExpanded,
    isSelected,
    itemHeight,
    indentSize = 20,
    onToggleExpand,
    onSelect
  }: Props = $props();

  // 计算缩进
  let indent = $derived(node.depth * indentSize);
</script>

<div
  class="file-node-row"
  class:selected={isSelected}
  style="height: {itemHeight}px; padding-left: {indent}px;"
  onclick={onSelect}
  onkeydown={(e) => e.key === 'Enter' && onSelect()}
  role="treeitem"
  tabindex="0"
  aria-selected={isSelected}
>
  <!-- 展开/收起按钮 -->
  <button
    class="expand-btn"
    class:has-children={node.hasChildren}
    class:expanded={isExpanded}
    onclick={(e) => {
      e.stopPropagation();
      onToggleExpand();
    }}
    disabled={!node.hasChildren}
    aria-label={isExpanded ? 'Collapse' : 'Expand'}
  >
    {#if node.hasChildren}
      <svg class="expand-icon" viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
      </svg>
    {:else}
      <span class="leaf-spacer"></span>
    {/if}
  </button>

  <!-- 图标 -->
  <span class="node-icon">
    {#if node.nodeType === 'folder'}
      <svg viewBox="0 0 24 24" width="18" height="18">
        {#if isExpanded}
          <!-- 打开的文件夹 -->
          <path
            fill="#faad14"
            d="M19 20H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h6l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z"
          />
        {:else}
          <!-- 关闭的文件夹 -->
          <path
            fill="#faad14"
            d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
          />
        {/if}
      </svg>
    {:else}
      <!-- 文件图标 -->
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path
          fill="#8c8c8c"
          d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"
        />
      </svg>
    {/if}
  </span>

  <!-- 节点名称 -->
  <span class="node-name" title={node.name}>
    {node.name}
  </span>
</div>

<style>
  .file-node-row {
    display: flex;
    align-items: center;
    gap: 4px;
    box-sizing: border-box;
    user-select: none;
    cursor: pointer;
    transition: background-color 0.15s;
    border-radius: 4px;
    margin: 0 4px;
  }

  .file-node-row:hover {
    background-color: #f0f0f0;
  }

  .file-node-row.selected {
    background-color: #e6f7ff;
  }

  .file-node-row.selected:hover {
    background-color: #bae7ff;
  }

  .expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  .expand-btn:hover:not(:disabled) {
    background-color: #e0e0e0;
  }

  .expand-btn:disabled {
    cursor: default;
  }

  .expand-btn.expanded .expand-icon {
    transform: rotate(90deg);
  }

  .expand-icon {
    transition: transform 0.2s;
  }

  .leaf-spacer {
    width: 16px;
    height: 16px;
  }

  .node-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .node-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    color: #333;
  }
</style>
