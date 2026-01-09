// Types
export type {
  FileEvent,
  SourceNode,
  DisplayNode,
  FlatDisplayNode,
  DisplayTreeIndex,
  VirtualListState
} from './types';

// Source Store
export { SourceTreeStore } from './source-store';

// Compress
export { buildDisplayTree, buildCompressedChain, findDisplayIdBySourceId } from './compress';

// Flatten
export { flattenDisplayNodes, computeVisibleDisplayNodes } from './flatten-display';

// Virtual List
export { VirtualListController, calculateVisibleRange } from './virtual-list';

// Manager
export { CompressedTreeManager, createCompressedTreeManager } from './compressed-manager.svelte';
