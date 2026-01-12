<script lang="ts">
  import type { TreeNode, TreeIndex, CheckState } from '@light-cat/treekit-core';
  import { getCheckState } from '@light-cat/treekit-core';
  import TreeNodeComponent from '../tree/TreeNode.svelte';
  import VirtualList from './VirtualList.svelte';

  interface Props {
    visibleList: TreeNode[];
    flatNodes: TreeNode[];
    expandedSet: ReadonlySet<string>;
    checkedSet: ReadonlySet<string>;
    matchSet?: ReadonlySet<string>;
    showCheckbox?: boolean;
    checkStrictly?: boolean;
    currentMatchId?: string | null;
    selectedId?: string | null;
    index: TreeIndex;
    itemHeight?: number;
    onToggleExpand: (nodeId: string) => void;
    onToggleCheck: (nodeId: string) => void;
    onNodeClick: (nodeId: string) => void;
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
    selectedId = null,
    index,
    itemHeight = 32,
    onToggleExpand,
    onToggleCheck,
    onNodeClick
  }: Props = $props();

  /**
   * 获取节点勾选状态（支持 checkStrictly 模式）
   */
  function getCheckStateForNode(node: TreeNode): CheckState {
    if (checkStrictly) {
      return checkedSet.has(node.id) ? 'checked' : 'unchecked';
    }
    return getCheckState(node, flatNodes, checkedSet);
  }

  let listRef: ReturnType<typeof VirtualList>;

  /**
   * 滚动到指定节点
   */
  export function scrollToNode(nodeId: string) {
    listRef?.scrollToNode(nodeId);
  }

  /**
   * 滚动到顶部
   */
  export function scrollToTop() {
    listRef?.scrollToTop();
  }

  /**
   * 滚动到底部
   */
  export function scrollToBottom() {
    listRef?.scrollToBottom();
  }
</script>

<VirtualList bind:this={listRef} items={visibleList} {itemHeight}>
  {#snippet children(node)}
    <TreeNodeComponent
      {node}
      expanded={expandedSet.has(node.id)}
      checkState={getCheckStateForNode(node)}
      {showCheckbox}
      isMatch={matchSet?.has(node.id)}
      isCurrent={currentMatchId === node.id}
      isSelected={selectedId === node.id}
      {itemHeight}
      onToggleExpand={() => onToggleExpand(node.id)}
      onToggleCheck={() => onToggleCheck(node.id)}
      onNodeClick={() => onNodeClick(node.id)}
    />
  {/snippet}
</VirtualList>
