<script lang="ts">
  import type { FlatNode, CheckState } from '$lib/tree/types';

  interface Props {
    node: FlatNode;
    isExpanded: boolean;
    checkState: CheckState;
    showCheckbox?: boolean;
    isSearchMatch: boolean;
    isCurrent?: boolean;
    itemHeight: number;
    indentSize?: number;
    onToggleExpand: () => void;
    onToggleCheck: () => void;
  }

  let {
    node,
    isExpanded,
    checkState,
    showCheckbox = false,
    isSearchMatch,
    isCurrent = false,
    itemHeight,
    indentSize = 20,
    onToggleExpand,
    onToggleCheck
  }: Props = $props();

  // 计算缩进
  let indent = $derived(node.depth * indentSize + (showCheckbox ? 0 : 20));
</script>

<div
  class="tree-node-row"
  class:search-match={isSearchMatch}
  class:current-match={isCurrent}
  style="height: {itemHeight}px; padding-left: {indent}px;"
>
  <!-- 展开/收起按钮 -->
  <button
    class="expand-btn"
    class:has-children={node.hasChildren}
    class:expanded={isExpanded}
    onclick={onToggleExpand}
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

  {#if showCheckbox}
    <!-- 复选框 -->
    <label class="checkbox-wrapper">
      <input
        type="checkbox"
        checked={checkState === 'checked'}
        indeterminate={checkState === 'indeterminate'}
        onchange={onToggleCheck}
      />
      <span class="checkbox-visual" class:indeterminate={checkState === 'indeterminate'}></span>
    </label>
  {/if}

  <!-- 节点名称 -->
  <span class="node-name" title={node.name}>
    {node.name}
  </span>
</div>

<style>
  .tree-node-row {
    display: flex;
    align-items: center;
    gap: 4px;
    box-sizing: border-box;
    border-bottom: 1px solid #f0f0f0;
    user-select: none;
    transition: background-color 0.15s;
  }

  .tree-node-row:hover {
    background-color: #f5f5f5;
  }

  .tree-node-row.search-match {
    background-color: #fffbe6;
  }

  .tree-node-row.search-match:hover {
    background-color: #fff1b8;
  }

  .tree-node-row.current-match {
    background-color: #bae7ff;
    box-shadow: inset 0 0 0 2px #1890ff;
  }

  .tree-node-row.current-match:hover {
    background-color: #91d5ff;
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

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .checkbox-wrapper input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .checkbox-visual {
    width: 16px;
    height: 16px;
    border: 2px solid #666;
    border-radius: 3px;
    background: white;
    position: relative;
    transition: all 0.15s;
  }

  .checkbox-wrapper input:checked + .checkbox-visual {
    background: #1890ff;
    border-color: #1890ff;
  }

  .checkbox-wrapper input:checked + .checkbox-visual::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 1px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .checkbox-visual.indeterminate {
    background: #1890ff;
    border-color: #1890ff;
  }

  .checkbox-visual.indeterminate::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 5px;
    width: 8px;
    height: 2px;
    background: white;
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
