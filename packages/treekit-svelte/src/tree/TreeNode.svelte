<script lang="ts">
  import type { TreeNode, CheckState } from '@light-cat/treekit-core';

  interface Props {
    /** 节点数据 */
    node: TreeNode;
    /** 是否展开 */
    expanded: boolean;
    /** 勾选状态 */
    checkState: CheckState;
    /** 是否显示 checkbox */
    showCheckbox?: boolean;
    /** 是否匹配搜索 */
    isMatch?: boolean;
    /** 是否当前导航项 */
    isCurrent?: boolean;
    /** 是否选中（单选） */
    isSelected?: boolean;
    /** 行高 */
    itemHeight?: number;
    /** 缩进宽度 */
    indentSize?: number;
    /** 额外 class */
    class?: string;
    /** 展开/折叠事件 */
    onToggleExpand?: () => void;
    /** 勾选事件 */
    onToggleCheck?: () => void;
    /** 节点点击事件 */
    onNodeClick?: () => void;
  }

  let {
    node,
    expanded,
    checkState,
    showCheckbox = false,
    isMatch = false,
    isCurrent = false,
    isSelected = false,
    itemHeight = 32,
    indentSize = 20,
    class: className = '',
    onToggleExpand,
    onToggleCheck,
    onNodeClick
  }: Props = $props();

  // 计算缩进
  let indent = $derived(node.depth * indentSize + (showCheckbox ? 0 : 20));
</script>

<div
  class="treekit-node {className}"
  class:treekit-node--match={isMatch}
  class:treekit-node--current={isCurrent}
  class:treekit-node--selected={isSelected}
  class:treekit-node--has-children={node.hasChildren}
  style:height="{itemHeight}px"
  style:padding-left="{indent}px"
  data-expanded={expanded}
  data-checkstate={checkState}
  data-match={isMatch}
  data-current={isCurrent}
  data-selected={isSelected}
  data-id={node.id}
>
  <!-- 展开/收起按钮 -->
  <button
    class="treekit-expand"
    class:treekit-expand--expanded={expanded}
    class:treekit-expand--has-children={node.hasChildren}
    onclick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
    disabled={!node.hasChildren}
    aria-label={expanded ? 'Collapse' : 'Expand'}
    type="button"
  >
    {#if node.hasChildren}
      <svg class="treekit-expand-icon" viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
      </svg>
    {:else}
      <span class="treekit-spacer"></span>
    {/if}
  </button>

  {#if showCheckbox}
    <!-- 复选框 -->
    <label class="treekit-checkbox-wrapper">
      <input
        class="treekit-checkbox-input"
        type="checkbox"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
        onchange={(e) => { e.stopPropagation(); onToggleCheck?.(); }}
      />
      <span
        class="treekit-checkbox-visual"
        class:treekit-checkbox-visual--checked={checkState === 'checked'}
        class:treekit-checkbox-visual--indeterminate={checkState === 'indeterminate'}
      ></span>
    </label>
  {/if}

  <!-- 节点名称 -->
  <span
    class="treekit-label"
    title={node.name}
    onclick={(e) => { e.stopPropagation(); onNodeClick?.(); }}
  >
    {node.name}
  </span>
</div>
