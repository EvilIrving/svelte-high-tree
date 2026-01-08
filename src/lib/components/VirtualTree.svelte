<script lang="ts">
  import { VirtualTree } from '@light-cat/treekit-svelte';
  import type { FlatNode, TreeIndex } from '@light-cat/treekit-core';

  interface Props {
    visibleList: FlatNode[];
    flatNodes: FlatNode[];
    expandedSet: Set<string>;
    checkedSet: Set<string>;
    matchSet?: Set<string>;
    showCheckbox?: boolean;
    currentMatchId?: string | null;
    index: TreeIndex;
    itemHeight?: number;
    onToggleExpand: (nodeId: string) => void;
    onToggleCheck: (nodeId: string) => void;
  }

  let { ...rest }: Props = $props();

  let virtualTreeRef: any;

  export function scrollToNode(nodeId: string) {
    virtualTreeRef?.scrollToNode(nodeId);
  }

  export function scrollToTop() {
    virtualTreeRef?.scrollToTop();
  }

  export function scrollToBottom() {
    virtualTreeRef?.scrollToBottom();
  }
</script>

<VirtualTree bind:this={virtualTreeRef} {...rest} />
